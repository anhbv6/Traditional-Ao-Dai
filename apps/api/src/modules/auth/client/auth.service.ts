import { prisma, type User } from '@repo/db'
import { randomBytes, randomUUID } from 'crypto'
import { OAuth2Client, type TokenPayload } from 'google-auth-library'
import { comparePassword, hashPassword } from '../../../shared/utils/password'
import { generateAccessToken, generateRefreshToken, JWTPayload, verifyToken } from '../../../shared/utils/jwt'
import { AppError } from '../../../shared/middlewares/errorHandler'
import { env } from '../../../shared/config/env'
import {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  OtpLoginInput,
  ForgotPasswordEmailInput,
  ResetPasswordEmailInput,
  ResetPasswordPhoneInput,
  VerifyResetPasswordEmailInput,
  VerifyResetPasswordPhoneInput,
} from '../auth.schema'
import { durationToMs } from '../../../shared/utils/time'
import { normalizeVietnamPhone } from '../../../shared/utils/phone'
import { CheckAccountResult, SessionMeta } from '../auth.types'
import { verifyOtp } from '../../otp/otp.service'
import { sendVerificationCodeEmail } from '../../../shared/utils/mail'
import { redis } from '../../../shared/utils/redis'
import { assertRateLimit } from '../../../shared/utils/rateLimit'
import { issueVerificationCode, verifyVerificationCode } from '../../../shared/utils/verificationCode'
import { cleanupUserSessions, hashToken } from '../../../shared/utils/session'

const SESSION_REFRESH_EXPIRES_IN = '24h'
const REMEMBER_REFRESH_EXPIRES_IN = '7d'

/** Khoảng ân hạn cho phép refresh token vừa bị xoay vòng được dùng lại (nhiều tab refresh cùng lúc) */
const REFRESH_REUSE_GRACE_SECONDS = 30

function getRefreshTokenPolicy(rememberMe: boolean) {
  const expiresIn = rememberMe ? REMEMBER_REFRESH_EXPIRES_IN : SESSION_REFRESH_EXPIRES_IN

  return {
    expiresIn,
    expiresAt: new Date(Date.now() + durationToMs(expiresIn)),
    rememberMe,
  }
}

function buildAuthTokens(
  user: { id: string; role: JWTPayload['role'] },
  sessionId: string,
  options: { familyId: string; refreshExpiresIn: string; rememberMe: boolean }
) {
  const payload = {
    userId: user.id,
    role: user.role,
    sessionId,
    familyId: options.familyId,
    rememberMe: options.rememberMe,
  }

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload, options.refreshExpiresIn),
  }
}

async function createClientSession(
  user: { id: string; role: JWTPayload['role'] },
  meta: SessionMeta,
  rememberMe: boolean
) {
  const refreshPolicy = getRefreshTokenPolicy(rememberMe)
  const sessionId = randomUUID()
  const familyId = sessionId
  const tokens = buildAuthTokens(user, sessionId, {
    familyId,
    refreshExpiresIn: refreshPolicy.expiresIn,
    rememberMe,
  })

  await cleanupUserSessions(user.id)

  await prisma.userSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshToken: hashToken(tokens.refreshToken),
      familyId,
      deviceInfo: meta.deviceInfo,
      ipAddress: meta.ipAddress,
      expiresAt: refreshPolicy.expiresAt,
    },
  })

  return {
    ...tokens,
    refreshTokenExpiresAt: refreshPolicy.expiresAt,
    rememberMe,
  }
}

async function revokeRefreshTokenFamily(familyId: string) {
  await prisma.userSession.updateMany({
    where: { familyId },
    data: { isRevoked: true },
  })
}

function omitPassword<T extends { password: string | null }>(user: T): Omit<T, 'password'> {
  const { password: _, ...safeUser } = user
  return safeUser
}

// ─── Reset Token (sau khi xác minh mã quên mật khẩu) ────────────────────────────

const RESET_TOKEN_TTL_SECONDS = 600
const RESET_CODE_TTL_SECONDS = 600
const RESET_EMAIL_COOLDOWN_SECONDS = 60
const RESET_EMAIL_DAILY_LIMIT = 10

const EMAIL_RESET_ERROR_KEYS = {
  expired: 'VERIFICATION_CODE_EXPIRED_OR_INVALID',
  incorrect: 'INCORRECT_VERIFICATION_CODE',
  tooManyAttempts: 'VERIFICATION_TOO_MANY_ATTEMPTS',
}

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
 * Tìm khách hàng được phép đăng nhập OTP / đặt lại mật khẩu bằng SĐT.
 * Chỉ chấp nhận SĐT ĐÃ XÁC MINH: nếu SĐT chỉ được khai báo (chưa xác minh) thì người sở hữu số đó
 * chưa chắc là chủ tài khoản (ví dụ khách gõ nhầm số của người khác khi đăng ký bằng email).
 */
async function findCustomerByVerifiedPhone(normalizedPhone: string) {
  const user = await prisma.user.findFirst({
    where: { phone: normalizedPhone, role: 'CUSTOMER' },
  })

  if (!user) {
    return null
  }

  if (!user.isPhoneVerified) {
    throw new AppError(400, 'PHONE_NOT_VERIFIED')
  }

  return user
}

// ─── Register ──────────────────────────────────────────────────────────────────

/**
 * Registers a new client (customer).
 */
export async function clientRegister(input: RegisterInput['body']) {
  const { registerType, password, name } = input

  const finalEmail = input.email ? input.email.trim().toLowerCase() : null
  const finalPhone = registerType === 'phone' ? normalizeVietnamPhone(input.phone) || null : null

  // 1. Kiểm tra trùng lặp TRƯỚC khi tiêu thụ OTP (tránh mất mã khi thông tin bị trùng)
  if (finalEmail) {
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: finalEmail },
      select: { id: true },
    })
    if (existingEmailUser) {
      throw new AppError(400, 'EMAIL_ALREADY_EXISTS')
    }
  }

  const phoneHolder = finalPhone
    ? await prisma.user.findUnique({
        where: { phone: finalPhone },
        select: { id: true, isPhoneVerified: true },
      })
    : null

  // SĐT đã được xác minh bởi tài khoản khác -> không thể dùng
  if (phoneHolder?.isPhoneVerified) {
    throw new AppError(400, 'PHONE_ALREADY_EXISTS')
  }

  // 2. Đăng ký bằng SĐT bắt buộc xác minh OTP
  if (registerType === 'phone') {
    await verifyOtp(input.phone, 'REGISTER', input.code)
  }

  const hashedPassword = await hashPassword(password)

  return prisma.$transaction(async (tx) => {
    // Người vừa chứng minh sở hữu SĐT bằng OTP được nhận số này: gỡ SĐT chưa xác minh khỏi tài khoản cũ
    if (registerType === 'phone' && phoneHolder) {
      await tx.user.update({
        where: { id: phoneHolder.id },
        data: { phone: null, isPhoneVerified: false },
      })
    }

    return tx.user.create({
      data: {
        email: finalEmail,
        password: hashedPassword,
        name: name || null,
        phone: finalPhone,
        role: 'CUSTOMER',
        isPhoneVerified: registerType === 'phone',
      },
    })
  })
}

// ─── Login ─────────────────────────────────────────────────────────────────────

/**
 * Validates client credentials and generates a JWT access token.
 * Không phân biệt "sai tài khoản" và "sai mật khẩu" để tránh dò tài khoản (user enumeration).
 */
export async function clientLogin(input: LoginInput['body'], meta: SessionMeta = {}) {
  const emailOrPhone = input.email.trim()
  const rememberMe = input.rememberMe ?? false

  const isEmail = emailOrPhone.includes('@')
  const user = isEmail
    ? await prisma.user.findFirst({ where: { email: { equals: emailOrPhone, mode: 'insensitive' } } })
    : await prisma.user.findFirst({ where: { phone: normalizeVietnamPhone(emailOrPhone) } })

  const isPasswordMatch =
    !!user && user.role === 'CUSTOMER' && !!user.password && (await comparePassword(input.password, user.password))

  if (!user || !isPasswordMatch) {
    throw new AppError(401, 'INVALID_CREDENTIALS')
  }

  // Chỉ báo tài khoản bị khóa khi đã nhập đúng mật khẩu
  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }

  const tokens = await createClientSession(user, meta, rememberMe)

  return {
    ...tokens,
    user: omitPassword(user),
  }
}

/**
 * Đăng nhập bằng OTP (chỉ dành cho tài khoản có SĐT đã xác minh)
 */
export async function clientLoginWithOtp(input: OtpLoginInput['body'], meta: SessionMeta = {}) {
  const { phone, code } = input
  const normalizedPhone = normalizeVietnamPhone(phone)!

  const user = await findCustomerByVerifiedPhone(normalizedPhone)
  if (!user) {
    throw new AppError(400, 'ACCOUNT_NOT_REGISTERED')
  }

  await verifyOtp(normalizedPhone, 'LOGIN', code)

  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }

  const rememberMe = input.rememberMe ?? false
  const tokens = await createClientSession(user, meta, rememberMe)

  return {
    ...tokens,
    user: omitPassword(user),
  }
}

// ─── Refresh Token ─────────────────────────────────────────────────────────────

function refreshGraceKey(refreshTokenHash: string) {
  return `refresh:grace:${refreshTokenHash}`
}

/**
 * Refreshes a client access token.
 */
export async function refreshClientToken(input: RefreshTokenInput['body']) {
  let decoded: JWTPayload
  try {
    decoded = verifyToken(input.refreshToken)
  } catch (error) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN')
  }

  if (decoded.tokenType !== 'refresh' || !decoded.sessionId || !decoded.familyId) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN_TYPE')
  }

  const currentRefreshTokenHash = hashToken(input.refreshToken)
  let session = await prisma.userSession.findUnique({
    where: { refreshToken: currentRefreshTokenHash },
    include: { user: true },
  })
  let isGraceReuse = false

  if (!session) {
    // Token vừa bị xoay vòng bởi một tab khác trong vài giây trước -> không coi là đánh cắp
    const graceSessionId = await redis.get(refreshGraceKey(currentRefreshTokenHash))
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

  if (
    session.id !== decoded.sessionId ||
    session.familyId !== decoded.familyId ||
    session.userId !== decoded.userId ||
    session.isRevoked ||
    session.expiresAt <= new Date() ||
    !session.user.isActive ||
    session.user.role !== 'CUSTOMER'
  ) {
    throw new AppError(401, 'SESSION_EXPIRED_OR_REVOKED')
  }

  const rememberMe = decoded.rememberMe === true

  // Phiên không ghi nhớ hoặc dùng lại trong khoảng ân hạn: chỉ cấp access token mới, không xoay vòng refresh token.
  // (Cookie trong trình duyệt dùng chung giữa các tab nên tab đến sau đã có sẵn refresh token mới.)
  if (!rememberMe || isGraceReuse) {
    return {
      accessToken: generateAccessToken({
        userId: session.user.id,
        role: session.user.role,
        sessionId: session.id,
        familyId: session.familyId,
        rememberMe,
      }),
      refreshToken: undefined,
      refreshTokenExpiresAt: session.expiresAt,
      rememberMe,
      user: omitPassword(session.user),
    }
  }

  const refreshPolicy = getRefreshTokenPolicy(true)
  const tokens = buildAuthTokens(session.user, session.id, {
    familyId: session.familyId,
    refreshExpiresIn: refreshPolicy.expiresIn,
    rememberMe,
  })

  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      refreshToken: hashToken(tokens.refreshToken),
      expiresAt: refreshPolicy.expiresAt,
      isRevoked: false,
    },
  })

  await redis.set(refreshGraceKey(currentRefreshTokenHash), session.id, 'EX', REFRESH_REUSE_GRACE_SECONDS)

  return {
    ...tokens,
    refreshTokenExpiresAt: refreshPolicy.expiresAt,
    rememberMe,
    user: omitPassword(session.user),
  }
}

// ─── Logout ────────────────────────────────────────────────────────────────────

/**
 * Logs out a client by deleting their session from the database.
 */
export async function logoutClient(userId: string, sessionId?: string, refreshToken?: string) {
  if (sessionId) {
    await prisma.userSession.deleteMany({
      where: {
        id: sessionId,
        userId,
      },
    })
    return
  }

  if (!refreshToken) {
    throw new AppError(400, 'REFRESH_TOKEN_REQUIRED')
  }

  await prisma.userSession.deleteMany({
    where: {
      userId,
      refreshToken: hashToken(refreshToken),
    },
  })
}

export async function logoutClientByRefreshToken(refreshToken: string) {
  let decoded: JWTPayload
  try {
    decoded = verifyToken(refreshToken)
  } catch (error) {
    return
  }

  if (decoded.tokenType !== 'refresh' || !decoded.sessionId) {
    return
  }

  // Xóa theo sessionId (không đòi khớp hash) để đăng xuất được cả khi tab đang giữ refresh token cũ trong khoảng ân hạn
  await prisma.userSession.deleteMany({
    where: {
      id: decoded.sessionId,
      userId: decoded.userId,
    },
  })
}

// ─── Check Account ─────────────────────────────────────────────────────────────

/**
 * Checks if an email or phone is already registered (phục vụ form đăng ký, đã được giới hạn tần suất ở route).
 */
export async function checkAccountAvailability(email?: string, phone?: string): Promise<CheckAccountResult> {
  if (!email && !phone) {
    throw new AppError(400, 'EMAIL_OR_PHONE_REQUIRED')
  }

  if (email) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    })
    return {
      available: !user,
      reason: user ? 'EMAIL_TAKEN' : 'AVAILABLE',
    }
  }

  // SĐT chỉ được coi là đã dùng khi đã được xác minh (SĐT khai báo chưa xác minh có thể được chủ thật nhận lại bằng OTP)
  const user = await prisma.user.findUnique({
    where: { phone: normalizeVietnamPhone(phone)! },
    select: { id: true, isPhoneVerified: true },
  })
  const isTaken = !!user?.isPhoneVerified
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

  return { ...payload, sub: payload.sub, email: payload.email.trim().toLowerCase() }
}

function assertCanUseGoogleLogin(user: User) {
  if (user.role !== 'CUSTOMER') {
    throw new AppError(403, 'INSUFFICIENT_PERMISSIONS')
  }
  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }
}

/**
 * Đăng nhập bằng Google:
 * 1. Đã liên kết (SocialAccount GOOGLE + sub) -> đăng nhập vào đúng tài khoản đã liên kết
 * 2. Chưa liên kết, email chưa có tài khoản -> tạo tài khoản mới + liên kết
 * 3. Chưa liên kết, email trùng tài khoản ĐÃ XÁC MINH email -> tự động liên kết
 * 4. Chưa liên kết, email trùng tài khoản CHƯA XÁC MINH email -> CHẶN (chống chiếm trước tài khoản).
 *    Chủ tài khoản đăng nhập bằng mật khẩu (hoặc dùng quên mật khẩu qua email) rồi liên kết Google trong hồ sơ.
 */
export async function clientLoginWithGoogle(credential: string, meta: SessionMeta, rememberMe: boolean = true) {
  const payload = await verifyGoogleCredential(credential)

  const linkedAccount = await prisma.socialAccount.findUnique({
    where: { provider_providerId: { provider: 'GOOGLE', providerId: payload.sub } },
    include: { user: true },
  })

  let user: User

  if (linkedAccount) {
    user = linkedAccount.user
    assertCanUseGoogleLogin(user)
  } else {
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { socialAccounts: true },
    })

    if (!existingUser) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || null,
          avatar: payload.picture || null,
          role: 'CUSTOMER',
          isActive: true,
          isEmailVerified: true,
          socialAccounts: {
            create: { provider: 'GOOGLE', providerId: payload.sub },
          },
        },
      })
    } else {
      assertCanUseGoogleLogin(existingUser)

      if (!existingUser.isEmailVerified) {
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
          avatar: existingUser.avatar || payload.picture || null,
          socialAccounts: {
            create: { provider: 'GOOGLE', providerId: payload.sub },
          },
        },
      })
    }
  }

  const tokens = await createClientSession(user, meta, rememberMe)

  return {
    user: omitPassword(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    rememberMe: tokens.rememberMe,
  }
}

// ─── Forgot / Reset Password ───────────────────────────────────────────────────

/**
 * Gửi mã đặt lại mật khẩu qua email.
 * Luôn trả về thành công dù email có tồn tại hay không để tránh dò tài khoản.
 */
export async function sendForgotPasswordEmail(input: ForgotPasswordEmailInput['body']): Promise<{ success: boolean; message: string }> {
  const email = input.email.trim().toLowerCase()

  const cooldownKey = emailResetCooldownKey(email)
  if (await redis.get(cooldownKey)) {
    throw new AppError(429, 'COOLDOWN_ACTIVE')
  }
  await redis.set(cooldownKey, '1', 'EX', RESET_EMAIL_COOLDOWN_SECONDS)

  const user = await prisma.user.findFirst({
    where: { email, role: 'CUSTOMER' },
    select: { id: true },
  })

  if (user) {
    await assertRateLimit(`email-daily:${email}`, RESET_EMAIL_DAILY_LIMIT, 24 * 60 * 60, 'EMAIL_DAILY_LIMIT_REACHED')

    const code = await issueVerificationCode(emailResetCodeKey(email), RESET_CODE_TTL_SECONDS)
    await sendVerificationCodeEmail({
      to: email,
      subject: 'Reset Password Verification Code',
      heading: 'Password Reset Request',
      intro: 'You requested to reset your password for your Traditional Ao Dai account. Use the verification code below:',
      code,
      ttlMinutes: RESET_CODE_TTL_SECONDS / 60,
    })
  }

  return { success: true, message: 'VERIFICATION_CODE_SENT' }
}

/**
 * Verifies an email reset password code and issues a short-lived reset token.
 */
export async function verifyResetPasswordEmailCode(input: VerifyResetPasswordEmailInput['body']) {
  const email = input.email.trim().toLowerCase()

  await verifyVerificationCode(emailResetCodeKey(email), input.code, EMAIL_RESET_ERROR_KEYS)
  await redis.del(emailResetCooldownKey(email))

  return storeResetToken('email', email)
}

/**
 * Verifies a phone reset password OTP and issues a short-lived reset token.
 */
export async function verifyResetPasswordPhoneCode(input: VerifyResetPasswordPhoneInput['body']) {
  const normalizedPhone = normalizeVietnamPhone(input.phone)
  if (!normalizedPhone) {
    throw new AppError(400, 'INVALID_PHONE_NUMBER')
  }

  await verifyOtp(normalizedPhone, 'RESET_PASSWORD', input.code)

  const user = await findCustomerByVerifiedPhone(normalizedPhone)
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND')
  }

  return storeResetToken('phone', normalizedPhone)
}

/**
 * Cập nhật mật khẩu mới và thu hồi toàn bộ phiên đăng nhập
 */
async function applyNewPassword(userId: string, password: string, extraData: { isEmailVerified?: boolean } = {}) {
  const hashedPassword = await hashPassword(password)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, ...extraData },
    }),
    prisma.userSession.deleteMany({
      where: { userId },
    }),
  ])
}

/**
 * Resets a user's password using email verification code or reset token.
 */
export async function resetPasswordByEmail(input: ResetPasswordEmailInput['body']): Promise<{ success: boolean }> {
  const email = input.email.trim().toLowerCase()
  const { code, password, resetToken } = input

  if (resetToken) {
    await consumeResetToken('email', resetToken, email)
  } else if (code) {
    await verifyVerificationCode(emailResetCodeKey(email), code, EMAIL_RESET_ERROR_KEYS)
  } else {
    throw new AppError(400, 'VERIFICATION_CODE_OR_RESET_TOKEN_REQUIRED')
  }

  const user = await prisma.user.findFirst({
    where: { email, role: 'CUSTOMER' },
    select: { id: true },
  })

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND')
  }

  // Nhận được mã qua email nghĩa là đã chứng minh sở hữu email -> đánh dấu email đã xác minh
  await applyNewPassword(user.id, password, { isEmailVerified: true })
  await redis.del(emailResetCooldownKey(email))

  return { success: true }
}

/**
 * Resets a user's password using phone OTP or reset token.
 */
export async function resetPasswordByPhone(input: ResetPasswordPhoneInput['body']): Promise<{ success: boolean }> {
  const { code, password, resetToken } = input
  const normalizedPhone = normalizeVietnamPhone(input.phone)
  if (!normalizedPhone) {
    throw new AppError(400, 'INVALID_PHONE_NUMBER')
  }

  if (resetToken) {
    await consumeResetToken('phone', resetToken, normalizedPhone)
  } else if (code) {
    await verifyOtp(normalizedPhone, 'RESET_PASSWORD', code)
  } else {
    throw new AppError(400, 'OTP_CODE_OR_RESET_TOKEN_REQUIRED')
  }

  const user = await findCustomerByVerifiedPhone(normalizedPhone)
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND')
  }

  await applyNewPassword(user.id, password)

  return { success: true }
}
