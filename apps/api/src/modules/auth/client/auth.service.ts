import { prisma, type User } from '@repo/db'
import { randomBytes, randomUUID } from 'crypto'
import { OAuth2Client, type TokenPayload } from 'google-auth-library'
import { normalizeEmail } from '@repo/shared'
import { comparePassword, hashPassword } from '../../../core/security/password'
import { generateAccessToken, generateRefreshToken, type JWTPayload, verifyToken } from '../../../core/security/jwt'
import { AppError } from '../../../core/http/AppError'
import { env } from '../../../config/env'
import {
  type LoginInput,
  type RegisterInput,
  type OtpLoginInput,
  type ForgotPasswordEmailInput,
  type ResetPasswordEmailInput,
  type ResetPasswordPhoneInput,
  type SendRegisterEmailCodeInput,
  type VerifyResetPasswordEmailInput,
  type VerifyResetPasswordPhoneInput,
} from '../auth.schema'
import { durationToMs } from '../../../core/utils/time'
import { normalizeVietnamPhone } from '../../../core/utils/phone'
import { type CheckAccountResult, type SessionMeta } from '../auth.types'
import { verifyOtp } from '../../otp/otp.service'
import { sendVerificationCodeEmail } from '../../../infra/mailer'
import { redis } from '../../../infra/redis'
import { assertRateLimit } from '../../../core/security/rateLimit'
import { issueVerificationCode, verifyVerificationCode } from '../../../core/security/verificationCode'
import { cleanupUserSessions, hashToken, revokeAllUserSessions } from '../../../core/security/session'

const SESSION_REFRESH_EXPIRES_IN = '24h'
const REMEMBER_REFRESH_EXPIRES_IN = '7d'

/** Khoảng ân hạn cho phép refresh token vừa bị xoay vòng được dùng lại (nhiều tab refresh cùng lúc) */
const REFRESH_REUSE_GRACE_SECONDS = 30

const EMAIL_CODE_TTL_SECONDS = 600
const EMAIL_COOLDOWN_SECONDS = 60
const EMAIL_DAILY_LIMIT = 10

const EMAIL_CODE_ERROR_KEYS = {
  expired: 'VERIFICATION_CODE_EXPIRED_OR_INVALID',
  incorrect: 'INCORRECT_VERIFICATION_CODE',
  tooManyAttempts: 'VERIFICATION_TOO_MANY_ATTEMPTS',
}

// ─── Phiên storefront ──────────────────────────────────────────────────────────

function getRefreshTokenPolicy(rememberMe: boolean) {
  const expiresIn = rememberMe ? REMEMBER_REFRESH_EXPIRES_IN : SESSION_REFRESH_EXPIRES_IN
  return {
    expiresIn,
    expiresAt: new Date(Date.now() + durationToMs(expiresIn)),
  }
}

function buildStoreTokens(
  user: Pick<User, 'id' | 'role'>,
  sessionId: string,
  options: { familyId: string; refreshExpiresIn: string; rememberMe: boolean }
) {
  const claims = {
    userId: user.id,
    role: user.role,
    sessionId,
    familyId: options.familyId,
    rememberMe: options.rememberMe,
  }

  return {
    accessToken: generateAccessToken(claims, 'store'),
    refreshToken: generateRefreshToken(claims, options.refreshExpiresIn),
  }
}

/**
 * Chỉ tài khoản ACTIVE mới đăng nhập được. Tài khoản đã xóa coi như không tồn tại.
 * Gọi SAU khi đã xác thực thông tin đăng nhập để không tiết lộ trạng thái tài khoản cho người lạ.
 */
function assertCanSignIn(user: Pick<User, 'status'>) {
  if (user.status === 'DELETED') {
    throw new AppError(401, 'INVALID_CREDENTIALS')
  }
  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }
}

/**
 * Tạo phiên STORE mới (mọi vai trò đều mua hàng được) và cấp cặp token
 */
async function createStoreSession(user: Pick<User, 'id' | 'role'>, meta: SessionMeta, rememberMe: boolean) {
  const refreshPolicy = getRefreshTokenPolicy(rememberMe)
  const sessionId = randomUUID()
  const tokens = buildStoreTokens(user, sessionId, {
    familyId: sessionId,
    refreshExpiresIn: refreshPolicy.expiresIn,
    rememberMe,
  })

  await cleanupUserSessions(user.id)

  await prisma.$transaction([
    prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        kind: 'STORE',
        refreshTokenHash: hashToken(tokens.refreshToken),
        familyId: sessionId,
        rememberMe,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: refreshPolicy.expiresAt,
      },
    }),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ])

  return {
    ...tokens,
    refreshTokenExpiresAt: refreshPolicy.expiresAt,
    rememberMe,
  }
}

async function revokeRefreshTokenFamily(familyId: string) {
  await prisma.userSession.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

/**
 * Tìm tài khoản được phép đăng nhập OTP / đặt lại mật khẩu bằng SĐT.
 * Chỉ chấp nhận SĐT ĐÃ XÁC MINH: SĐT chỉ được khai báo thì người giữ số chưa chắc là chủ tài khoản.
 */
async function findUserByVerifiedPhone(normalizedPhone: string) {
  const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })

  if (!user || user.status === 'DELETED') {
    return null
  }

  if (!user.phoneVerifiedAt) {
    throw new AppError(400, 'PHONE_NOT_VERIFIED')
  }

  return user
}

// ─── Register ──────────────────────────────────────────────────────────────────

function registerEmailCodeKey(email: string) {
  return `email:register:${email}`
}

function registerEmailCooldownKey(email: string) {
  return `email:cooldown:REGISTER:${email}`
}

/**
 * Gửi mã xác minh tới email trước khi đăng ký — tài khoản chỉ được tạo khi người dùng chứng minh sở hữu email.
 * Email đã có tài khoản thì báo trùng (đăng ký vốn đã công khai điều này qua /check-account).
 */
export async function sendRegisterEmailCode(input: SendRegisterEmailCodeInput['body']) {
  const email = normalizeEmail(input.email)

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    throw new AppError(400, 'EMAIL_ALREADY_EXISTS')
  }

  const cooldownKey = registerEmailCooldownKey(email)
  if (await redis.get(cooldownKey)) {
    throw new AppError(429, 'COOLDOWN_ACTIVE')
  }

  await assertRateLimit(`email-daily:${email}`, EMAIL_DAILY_LIMIT, 24 * 60 * 60, 'EMAIL_DAILY_LIMIT_REACHED')

  const code = await issueVerificationCode(registerEmailCodeKey(email), EMAIL_CODE_TTL_SECONDS)
  await redis.set(cooldownKey, '1', 'EX', EMAIL_COOLDOWN_SECONDS)

  await sendVerificationCodeEmail({
    to: email,
    subject: 'Verify your email',
    heading: 'Welcome to Traditional Ao Dai',
    intro: 'Use the verification code below to finish creating your Traditional Ao Dai account:',
    code,
    ttlMinutes: EMAIL_CODE_TTL_SECONDS / 60,
  })

  return { ttl: EMAIL_CODE_TTL_SECONDS }
}

/**
 * Đăng ký tài khoản khách hàng. Email hoặc SĐT đều phải xác minh bằng mã trước khi tạo tài khoản.
 */
export async function clientRegister(input: RegisterInput['body']) {
  const { password, name } = input
  const now = new Date()

  if (input.registerType === 'email') {
    const email = normalizeEmail(input.email)

    // Kiểm tra trùng TRƯỚC khi tiêu thụ mã (tránh mất mã khi thông tin bị trùng)
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      throw new AppError(400, 'EMAIL_ALREADY_EXISTS')
    }

    await verifyVerificationCode(registerEmailCodeKey(email), input.code, EMAIL_CODE_ERROR_KEYS)
    await redis.del(registerEmailCooldownKey(email))

    return prisma.user.create({
      data: {
        email,
        emailVerifiedAt: now,
        passwordHash: await hashPassword(password),
        passwordChangedAt: now,
        name: name || null,
      },
    })
  }

  const phone = normalizeVietnamPhone(input.phone)
  if (!phone) {
    throw new AppError(400, 'INVALID_PHONE_NUMBER')
  }

  const phoneHolder = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, phoneVerifiedAt: true },
  })

  // SĐT đã được xác minh bởi tài khoản khác -> không thể dùng
  if (phoneHolder?.phoneVerifiedAt) {
    throw new AppError(400, 'PHONE_ALREADY_EXISTS')
  }

  await verifyOtp(phone, 'REGISTER', input.code)
  const passwordHash = await hashPassword(password)

  return prisma.$transaction(async (tx) => {
    // Người vừa chứng minh sở hữu SĐT bằng OTP được nhận số này: gỡ SĐT chưa xác minh khỏi tài khoản cũ
    if (phoneHolder) {
      await tx.user.update({ where: { id: phoneHolder.id }, data: { phone: null } })
    }

    return tx.user.create({
      data: {
        phone,
        phoneVerifiedAt: now,
        passwordHash,
        passwordChangedAt: now,
        name: name || null,
      },
    })
  })
}

// ─── Login ─────────────────────────────────────────────────────────────────────

/**
 * Đăng nhập storefront bằng email/SĐT + mật khẩu. Mọi vai trò đều được (STAFF/ADMIN cũng mua hàng).
 * Không phân biệt "sai tài khoản" và "sai mật khẩu" để tránh dò tài khoản (user enumeration).
 */
export async function clientLogin(input: LoginInput['body'], meta: SessionMeta = {}) {
  const identifier = input.identifier.trim()
  const rememberMe = input.rememberMe ?? false

  const phone = identifier.includes('@') ? null : normalizeVietnamPhone(identifier)
  const user = identifier.includes('@')
    ? await prisma.user.findUnique({ where: { email: normalizeEmail(identifier) } })
    : phone
      ? await prisma.user.findUnique({ where: { phone } })
      : null

  const isPasswordMatch = !!user?.passwordHash && (await comparePassword(input.password, user.passwordHash))
  if (!user || !isPasswordMatch) {
    throw new AppError(401, 'INVALID_CREDENTIALS')
  }

  // Chỉ báo tài khoản bị khóa khi đã nhập đúng mật khẩu
  assertCanSignIn(user)

  return createStoreSession(user, meta, rememberMe)
}

/**
 * Đăng nhập bằng OTP (chỉ dành cho tài khoản có SĐT đã xác minh)
 */
export async function clientLoginWithOtp(input: OtpLoginInput['body'], meta: SessionMeta = {}) {
  const phone = normalizeVietnamPhone(input.phone)!

  const user = await findUserByVerifiedPhone(phone)
  if (!user) {
    throw new AppError(400, 'ACCOUNT_NOT_REGISTERED')
  }

  await verifyOtp(phone, 'LOGIN', input.code)
  assertCanSignIn(user)

  return createStoreSession(user, meta, input.rememberMe ?? false)
}

// ─── Refresh Token ─────────────────────────────────────────────────────────────

function refreshGraceKey(refreshTokenHash: string) {
  return `refresh:grace:${refreshTokenHash}`
}

/**
 * Cấp access token mới từ refresh token (cookie httpOnly).
 * - Phiên "ghi nhớ": xoay vòng refresh token; dùng lại token cũ ngoài khoảng ân hạn -> thu hồi cả họ
 * - Phiên thường: chỉ cấp access token mới
 */
export async function refreshClientToken(refreshToken: string) {
  let decoded: JWTPayload
  try {
    decoded = verifyToken(refreshToken, 'store')
  } catch {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN')
  }

  if (decoded.tokenType !== 'refresh' || !decoded.familyId) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN_TYPE')
  }

  const currentHash = hashToken(refreshToken)
  let session = await prisma.userSession.findUnique({
    where: { refreshTokenHash: currentHash },
    include: { user: true },
  })
  let isGraceReuse = false

  if (!session) {
    // Token vừa bị xoay vòng bởi một tab khác trong vài giây trước -> không coi là đánh cắp
    const graceSessionId = await redis.get(refreshGraceKey(currentHash))
    if (graceSessionId && graceSessionId === decoded.sessionId) {
      session = await prisma.userSession.findUnique({
        where: { id: graceSessionId },
        include: { user: true },
      })
      isGraceReuse = !!session
    }
  }

  if (!session) {
    await revokeRefreshTokenFamily(decoded.familyId)
    throw new AppError(401, 'REFRESH_TOKEN_REUSED')
  }

  const now = new Date()
  if (
    session.kind !== 'STORE' ||
    session.id !== decoded.sessionId ||
    session.familyId !== decoded.familyId ||
    session.userId !== decoded.userId ||
    session.revokedAt ||
    session.expiresAt <= now ||
    session.user.status !== 'ACTIVE'
  ) {
    throw new AppError(401, 'SESSION_EXPIRED_OR_REVOKED')
  }

  const rememberMe = session.rememberMe

  // Phiên không ghi nhớ hoặc dùng lại trong khoảng ân hạn: chỉ cấp access token mới, không xoay vòng refresh token.
  // (Cookie trong trình duyệt dùng chung giữa các tab nên tab đến sau đã có sẵn refresh token mới.)
  if (!rememberMe || isGraceReuse) {
    await prisma.userSession.update({ where: { id: session.id }, data: { lastUsedAt: now } })
    return {
      accessToken: generateAccessToken(
        {
          userId: session.user.id,
          role: session.user.role,
          sessionId: session.id,
          familyId: session.familyId,
          rememberMe,
        },
        'store'
      ),
      refreshToken: undefined,
      refreshTokenExpiresAt: session.expiresAt,
      rememberMe,
    }
  }

  const refreshPolicy = getRefreshTokenPolicy(true)
  const tokens = buildStoreTokens(session.user, session.id, {
    familyId: session.familyId,
    refreshExpiresIn: refreshPolicy.expiresIn,
    rememberMe,
  })

  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashToken(tokens.refreshToken),
      expiresAt: refreshPolicy.expiresAt,
      lastUsedAt: now,
    },
  })

  await redis.set(refreshGraceKey(currentHash), session.id, 'EX', REFRESH_REUSE_GRACE_SECONDS)

  return {
    ...tokens,
    refreshTokenExpiresAt: refreshPolicy.expiresAt,
    rememberMe,
  }
}

// ─── Logout ────────────────────────────────────────────────────────────────────

/**
 * Đăng xuất storefront: xóa đúng phiên của refresh token. Token hỏng/hết hạn thì bỏ qua (cookie vẫn bị xóa).
 */
export async function logoutClientByRefreshToken(refreshToken: string) {
  let decoded: JWTPayload
  try {
    decoded = verifyToken(refreshToken, 'store')
  } catch {
    return
  }

  if (decoded.tokenType !== 'refresh') {
    return
  }

  // Xóa theo sessionId (không đòi khớp hash) để đăng xuất được cả khi tab đang giữ refresh token cũ trong khoảng ân hạn
  await prisma.userSession.deleteMany({
    where: { id: decoded.sessionId, userId: decoded.userId, kind: 'STORE' },
  })
}

// ─── Check Account ─────────────────────────────────────────────────────────────

/**
 * Kiểm tra email / SĐT đã được dùng chưa (phục vụ form đăng ký, đã được giới hạn tần suất ở route)
 */
export async function checkAccountAvailability(email?: string, phone?: string): Promise<CheckAccountResult> {
  if (!email && !phone) {
    throw new AppError(400, 'EMAIL_OR_PHONE_REQUIRED')
  }

  if (email) {
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) }, select: { id: true } })
    return {
      available: !user,
      reason: user ? 'EMAIL_TAKEN' : 'AVAILABLE',
    }
  }

  // SĐT chỉ được coi là đã dùng khi đã được xác minh (SĐT khai báo chưa xác minh có thể được chủ thật nhận lại bằng OTP)
  const user = await prisma.user.findUnique({
    where: { phone: normalizeVietnamPhone(phone)! },
    select: { phoneVerifiedAt: true },
  })
  const isTaken = !!user?.phoneVerifiedAt
  return {
    available: !isTaken,
    reason: isTaken ? 'PHONE_TAKEN' : 'AVAILABLE',
  }
}

// ─── Google ────────────────────────────────────────────────────────────────────

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID)

/**
 * Xác minh Google ID Token và bắt buộc Google đã xác minh email
 */
export async function verifyGoogleCredential(credential: string): Promise<TokenPayload & { sub: string; email: string }> {
  let payload: TokenPayload | undefined
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch {
    throw new AppError(400, 'GOOGLE_AUTH_FAILED')
  }

  if (!payload?.sub || !payload.email) {
    throw new AppError(400, 'GOOGLE_TOKEN_INVALID')
  }

  if (payload.email_verified !== true) {
    throw new AppError(400, 'GOOGLE_EMAIL_NOT_VERIFIED')
  }

  return { ...payload, sub: payload.sub, email: normalizeEmail(payload.email) }
}

/**
 * Đăng nhập bằng Google:
 * 1. Đã liên kết (SocialAccount GOOGLE + sub) -> đăng nhập vào đúng tài khoản đã liên kết
 * 2. Chưa liên kết, email chưa có tài khoản -> tạo tài khoản mới + liên kết
 * 3. Chưa liên kết, email trùng tài khoản ĐÃ XÁC MINH email -> tự động liên kết
 * 4. Chưa liên kết, email trùng tài khoản CHƯA XÁC MINH email -> CHẶN (chống chiếm trước tài khoản).
 *    Chủ tài khoản đăng nhập bằng mật khẩu (hoặc quên mật khẩu qua email) rồi liên kết Google trong hồ sơ.
 */
export async function clientLoginWithGoogle(credential: string, meta: SessionMeta, rememberMe: boolean = true) {
  const payload = await verifyGoogleCredential(credential)

  const linkedAccount = await prisma.socialAccount.findUnique({
    where: { provider_providerUserId: { provider: 'GOOGLE', providerUserId: payload.sub } },
    include: { user: true },
  })

  let user: User

  if (linkedAccount) {
    user = linkedAccount.user
    assertCanSignIn(user)
  } else {
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { socialAccounts: true },
    })

    if (!existingUser) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          emailVerifiedAt: new Date(),
          name: payload.name || null,
          avatarUrl: payload.picture || null,
          socialAccounts: {
            create: { provider: 'GOOGLE', providerUserId: payload.sub, email: payload.email },
          },
        },
      })
    } else {
      assertCanSignIn(existingUser)

      if (!existingUser.emailVerifiedAt) {
        throw new AppError(409, 'GOOGLE_EMAIL_ACCOUNT_UNVERIFIED')
      }

      // Mỗi tài khoản chỉ liên kết với một tài khoản Google
      if (existingUser.socialAccounts.some((sa) => sa.provider === 'GOOGLE')) {
        throw new AppError(409, 'GOOGLE_ACCOUNT_MISMATCH')
      }

      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: existingUser.name || payload.name || null,
          avatarUrl: existingUser.avatarUrl || payload.picture || null,
          socialAccounts: {
            create: { provider: 'GOOGLE', providerUserId: payload.sub, email: payload.email },
          },
        },
      })
    }
  }

  return createStoreSession(user, meta, rememberMe)
}

// ─── Forgot / Reset Password ───────────────────────────────────────────────────
// Dùng cho MỌI vai trò: nhân viên quên mật khẩu cũng đặt lại ở storefront (cùng một tài khoản).

const RESET_TOKEN_TTL_SECONDS = 600

function emailResetCodeKey(email: string) {
  return `email:reset:${email}`
}

function emailResetCooldownKey(email: string) {
  return `email:cooldown:RESET_PASSWORD:${email}`
}

function resetTokenKey(type: 'email' | 'phone', token: string) {
  return `password-reset:${type}:${token}`
}

async function storeResetToken(type: 'email' | 'phone', target: string) {
  const resetToken = randomBytes(32).toString('hex')
  await redis.set(resetTokenKey(type, resetToken), target, 'EX', RESET_TOKEN_TTL_SECONDS)
  return {
    resetToken,
    expiresIn: RESET_TOKEN_TTL_SECONDS,
  }
}

async function consumeResetToken(type: 'email' | 'phone', token: string, expectedTarget: string) {
  const key = resetTokenKey(type, token)
  const storedTarget = await redis.get(key)
  if (!storedTarget || storedTarget !== expectedTarget) {
    throw new AppError(400, 'RESET_TOKEN_INVALID')
  }

  await redis.del(key)
}

/**
 * Gửi mã đặt lại mật khẩu qua email.
 * Luôn trả về thành công dù email có tồn tại hay không để tránh dò tài khoản.
 */
export async function sendForgotPasswordEmail(input: ForgotPasswordEmailInput['body']) {
  const email = normalizeEmail(input.email)

  const cooldownKey = emailResetCooldownKey(email)
  if (await redis.get(cooldownKey)) {
    throw new AppError(429, 'COOLDOWN_ACTIVE')
  }
  await redis.set(cooldownKey, '1', 'EX', EMAIL_COOLDOWN_SECONDS)

  const user = await prisma.user.findUnique({ where: { email }, select: { status: true } })

  if (user && user.status !== 'DELETED') {
    await assertRateLimit(`email-daily:${email}`, EMAIL_DAILY_LIMIT, 24 * 60 * 60, 'EMAIL_DAILY_LIMIT_REACHED')

    const code = await issueVerificationCode(emailResetCodeKey(email), EMAIL_CODE_TTL_SECONDS)
    await sendVerificationCodeEmail({
      to: email,
      subject: 'Reset Password Verification Code',
      heading: 'Password Reset Request',
      intro: 'You requested to reset your password for your Traditional Ao Dai account. Use the verification code below:',
      code,
      ttlMinutes: EMAIL_CODE_TTL_SECONDS / 60,
    })
  }
}

/**
 * Xác minh mã đặt lại mật khẩu qua email và cấp reset token ngắn hạn
 */
export async function verifyResetPasswordEmailCode(input: VerifyResetPasswordEmailInput['body']) {
  const email = normalizeEmail(input.email)

  await verifyVerificationCode(emailResetCodeKey(email), input.code, EMAIL_CODE_ERROR_KEYS)
  await redis.del(emailResetCooldownKey(email))

  return storeResetToken('email', email)
}

/**
 * Xác minh OTP đặt lại mật khẩu qua SĐT và cấp reset token ngắn hạn
 */
export async function verifyResetPasswordPhoneCode(input: VerifyResetPasswordPhoneInput['body']) {
  const phone = normalizeVietnamPhone(input.phone)
  if (!phone) {
    throw new AppError(400, 'INVALID_PHONE_NUMBER')
  }

  await verifyOtp(phone, 'RESET_PASSWORD', input.code)

  const user = await findUserByVerifiedPhone(phone)
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND')
  }

  return storeResetToken('phone', phone)
}

/**
 * Đặt mật khẩu mới và thu hồi toàn bộ phiên đăng nhập ở mọi khu (storefront lẫn quản trị)
 */
async function applyNewPassword(userId: string, password: string, extraData: { emailVerifiedAt?: Date } = {}) {
  const passwordHash = await hashPassword(password)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: new Date(), ...extraData },
  })
  await revokeAllUserSessions(userId)
}

/**
 * Đặt lại mật khẩu bằng mã email hoặc reset token
 */
export async function resetPasswordByEmail(input: ResetPasswordEmailInput['body']) {
  const email = normalizeEmail(input.email)
  const { code, password, resetToken } = input

  if (resetToken) {
    await consumeResetToken('email', resetToken, email)
  } else if (code) {
    await verifyVerificationCode(emailResetCodeKey(email), code, EMAIL_CODE_ERROR_KEYS)
  } else {
    throw new AppError(400, 'VERIFICATION_CODE_OR_RESET_TOKEN_REQUIRED')
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, status: true, emailVerifiedAt: true } })
  if (!user || user.status === 'DELETED') {
    throw new AppError(404, 'USER_NOT_FOUND')
  }

  // Nhận được mã qua email nghĩa là đã chứng minh sở hữu email -> đánh dấu email đã xác minh
  await applyNewPassword(user.id, password, user.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() })
  await redis.del(emailResetCooldownKey(email))
}

/**
 * Đặt lại mật khẩu bằng OTP SĐT hoặc reset token
 */
export async function resetPasswordByPhone(input: ResetPasswordPhoneInput['body']) {
  const { code, password, resetToken } = input
  const phone = normalizeVietnamPhone(input.phone)
  if (!phone) {
    throw new AppError(400, 'INVALID_PHONE_NUMBER')
  }

  if (resetToken) {
    await consumeResetToken('phone', resetToken, phone)
  } else if (code) {
    await verifyOtp(phone, 'RESET_PASSWORD', code)
  } else {
    throw new AppError(400, 'OTP_CODE_OR_RESET_TOKEN_REQUIRED')
  }

  const user = await findUserByVerifiedPhone(phone)
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND')
  }

  await applyNewPassword(user.id, password)
}
