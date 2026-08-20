import { prisma } from '@repo/db'
import { createHash, randomBytes, randomUUID } from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { comparePassword, hashPassword } from '../../../shared/utils/password'
import { generateAccessToken, generateRefreshToken, JWTPayload, verifyToken } from '../../../shared/utils/jwt'
import { AppError } from '../../../shared/middlewares/errorHandler'
import { env } from '../../../shared/config/env'
import {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  OtpLoginInput,
  GoogleLoginInput,
  ForgotPasswordEmailInput,
  ResetPasswordEmailInput,
  ResetPasswordPhoneInput,
  VerifyResetPasswordEmailInput,
  VerifyResetPasswordPhoneInput,
} from '../auth.schema'
import { durationToMs } from '../../../shared/utils/time'
import { normalizeVietnamPhone } from '../../../shared/utils/phone'
import { CheckAccountResult, SessionMeta } from '../auth.types'
import { verifyOtp, generateOtp } from '../../otp/otp.service'
import { mailProvider } from '../../../shared/utils/mail'
import { redis } from '../../../shared/utils/redis'

const SESSION_REFRESH_EXPIRES_IN = '24h'
const REMEMBER_REFRESH_EXPIRES_IN = '7d'

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

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
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

const RESET_TOKEN_TTL_SECONDS = 600

function createResetToken() {
  return randomBytes(32).toString('hex')
}

function resetTokenKey(type: 'email' | 'phone', token: string) {
  return `password-reset:${type}:${token}`
}

async function storeResetToken(type: 'email' | 'phone', target: string) {
  const resetToken = createResetToken()
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
    throw new AppError(400, 'Password reset session has expired or is invalid. Please request a new code.')
  }

  await redis.del(key)
}


/**
 * Registers a new client (customer).
 */
export async function clientRegister(input: RegisterInput['body']) {
  const { registerType, password, name } = input
  let finalEmail: string | null = null
  let finalPhone: string | null = null

  if (registerType === 'email') {
    const { email, phone } = input
    finalEmail = email.trim().toLowerCase()
    finalPhone = normalizeVietnamPhone(phone) || null
  } else {
    const { phone, email, code } = input
    // Verify OTP before register
    await verifyOtp(phone, 'REGISTER', code)

    finalPhone = normalizeVietnamPhone(phone)!
    finalEmail = email ? email.trim().toLowerCase() : null
  }

  // Check email conflict if provided
  if (finalEmail) {
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: finalEmail },
    })
    if (existingEmailUser) {
      throw new AppError(400, 'EMAIL_ALREADY_EXISTS')
    }
  }

  // Check phone conflict if provided
  if (finalPhone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: finalPhone },
    })
    if (existingPhone) {
      throw new AppError(400, 'PHONE_ALREADY_EXISTS')
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create client in DB
  const user = await prisma.user.create({
    data: {
      email: finalEmail,
      password: hashedPassword,
      name: name || null,
      phone: finalPhone,
      role: 'CUSTOMER',
      isPhoneVerified: registerType === 'phone',
    },
  })
  return user
}

/**
 * Validates client credentials and generates a JWT access token.
 */
export async function clientLogin(input: LoginInput['body'], meta: SessionMeta = {}) {
  const emailOrPhone = input.email.trim()
  const password = input.password
  const rememberMe = input.rememberMe ?? false

  // Find user by email or phone depending on input format
  const isEmail = emailOrPhone.includes('@')
  const user = isEmail
    ? await prisma.user.findFirst({ where: { email: { equals: emailOrPhone, mode: 'insensitive' } } })
    : await prisma.user.findFirst({ where: { phone: normalizeVietnamPhone(emailOrPhone) } })

  // Check user existence, verify they are a CUSTOMER
  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(401, 'Account does not exist or is not a customer account.')
  }

  if (!user.isActive) {
    throw new AppError(403, 'This account has been locked or deactivated.')
  }

  // Verify password
  const isPasswordMatch = await comparePassword(password, user.password || '')
  if (!isPasswordMatch) {
    throw new AppError(401, 'Incorrect password.')
  }

  const tokens = await createClientSession(user, meta, rememberMe)

  // Return user info excluding password and include token
  const { password: _, ...safeUser } = user
  return {
    ...tokens,
    user: safeUser,
  }
}

/**
 * Logins a client using phone number and OTP code.
 */
export async function clientLoginWithOtp(input: OtpLoginInput['body'], meta: SessionMeta = {}) {
  const { phone, code } = input

  // Verify OTP
  await verifyOtp(phone, 'LOGIN', code)

  const normalizedPhone = normalizeVietnamPhone(phone)

  // Find user by phone
  const user = await prisma.user.findFirst({
    where: { phone: normalizedPhone },
  })

  // Check user existence, verify they are a CUSTOMER
  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(400, 'Account is not registered. Please register first.')
  }

  if (!user.isActive) {
    throw new AppError(403, 'This account has been locked or deactivated.')
  }

  // Update phone verified status if not already set
  if (!user.isPhoneVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isPhoneVerified: true },
    })
    user.isPhoneVerified = true
  }

  const tokens = await createClientSession(user, meta, false)

  const { password: _, ...safeUser } = user
  return {
    ...tokens,
    user: safeUser,
  }
}

/**
 * Rotates a valid refresh token and returns a new token pair.
 */
export async function refreshClientToken(input: RefreshTokenInput['body']) {
  let decoded: JWTPayload

  try {
    decoded = verifyToken(input.refreshToken)
  } catch (error) {
    throw new AppError(401, 'Invalid or expired refresh token')
  }

  if (decoded.tokenType !== 'refresh' || !decoded.sessionId || !decoded.familyId) {
    throw new AppError(401, 'Invalid refresh token type')
  }

  const currentRefreshTokenHash = hashToken(input.refreshToken)
  const session = await prisma.userSession.findUnique({
    where: {
      refreshToken: currentRefreshTokenHash,
    },
    include: {
      user: true,
    },
  })

  if (!session) {
    await revokeRefreshTokenFamily(decoded.familyId)
    throw new AppError(401, 'Refresh token has been reused. Session family revoked.')
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
    throw new AppError(401, 'Session expired or revoked')
  }

  const rememberMe = decoded.rememberMe === true

  if (!rememberMe) {
    const tokens = {
      accessToken: generateAccessToken({
        userId: session.user.id,
        role: session.user.role,
        sessionId: session.id,
        familyId: session.familyId,
        rememberMe,
      }),
    }

    const { password: _, ...safeUser } = session.user
    return {
      ...tokens,
      refreshToken: undefined,
      refreshTokenExpiresAt: session.expiresAt,
      rememberMe,
      user: safeUser,
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

  const { password: _, ...safeUser } = session.user
  return {
    ...tokens,
    refreshTokenExpiresAt: refreshPolicy.expiresAt,
    rememberMe,
    user: safeUser,
  }
}

/**
 * Revokes the current client session.
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
    throw new AppError(400, 'Refresh token or authenticated session is required')
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

  await prisma.userSession.deleteMany({
    where: {
      id: decoded.sessionId,
      userId: decoded.userId,
      refreshToken: hashToken(refreshToken),
    },
  })
}

/**
 * Checks if a user already exists with the given email and/or phone.
 */
export async function checkAccountAvailability(email?: string, phone?: string): Promise<CheckAccountResult> {
  if (!email && !phone) {
    throw new AppError(400, 'At least email or phone number must be provided for verification')
  }

  if (email) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })
    return {
      available: !user,
      reason: user ? 'EMAIL_TAKEN' : 'AVAILABLE',
    }
  }

  // If email is not provided, phone must be provided
  const user = await prisma.user.findUnique({
    where: { phone: normalizeVietnamPhone(phone)! },
  })
  return {
    available: !user,
    reason: user ? 'PHONE_TAKEN' : 'AVAILABLE',
  }
}

/**
 * Updates user profile details in the database.
 */
export async function updateUserProfile(
  id: string,
  data: { name?: string; phone?: string; avatar?: string; dob?: string; gender?: string }
) {
  const updateData: any = {}

  if (data.name !== undefined) {
    updateData.name = data.name
  }

  if (data.phone !== undefined) {
    // Check if phone number is already in use by another user
    if (data.phone) {
      const existingPhoneUser = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          NOT: { id },
        },
      })
      if (existingPhoneUser) {
        throw new AppError(400, 'This phone number is already registered by another account.')
      }
    }
    updateData.phone = data.phone || null
  }

  if (data.avatar !== undefined) {
    updateData.avatar = data.avatar
  }

  if (data.dob !== undefined) {
    updateData.birth = data.dob ? new Date(data.dob) : null
  }

  if (data.gender !== undefined) {
    const genderUpper = String(data.gender).toUpperCase()
    if (genderUpper === 'MALE') {
      updateData.gender = 'MALE'
    } else if (genderUpper === 'FEMALE') {
      updateData.gender = 'FEMALE'
    } else {
      updateData.gender = 'OTHER'
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
  })

  const { password: _, ...safeUser } = updatedUser
  return safeUser
}

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID)

export async function clientLoginWithGoogle(credential: string, meta: SessionMeta) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload || !payload.email) {
      throw new AppError(400, 'Invalid Google ID token payload.')
    }

    const email = payload.email.trim().toLowerCase()
    const name = payload.name || null
    const avatar = payload.picture || null

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Create user
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatar,
          role: 'CUSTOMER',
          isActive: true,
          isEmailVerified: true,
        },
      })
    } else {
      // User exists, check if active
      if (!user.isActive) {
        throw new AppError(403, 'This account has been locked or deactivated.')
      }

      // Ensure they are customer
      if (user.role !== 'CUSTOMER') {
        throw new AppError(403, 'Access denied: insufficient permissions.')
      }

      // Optionally update name and avatar if not set
      if (!user.name || !user.avatar) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: user.name || name,
            avatar: user.avatar || avatar,
          },
        })
      }
    }

    const tokens = await createClientSession(user, meta, false)

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      rememberMe: tokens.rememberMe,
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error
    throw new AppError(400, `Google authentication failed: ${error.message}`)
  }
}

/**
 * Sends a 6-digit verification code to the customer's email for password reset
 */
export async function sendForgotPasswordEmail(input: ForgotPasswordEmailInput['body']): Promise<{ success: boolean; message: string }> {
  const email = input.email.trim().toLowerCase()

  // Find user
  const user = await prisma.user.findFirst({
    where: { email, role: 'CUSTOMER' },
  })

  if (!user) {
    throw new AppError(404, 'User with this email was not found.')
  }

  // Check cooldown
  const cooldownKey = `email:cooldown:RESET_PASSWORD:${email}`
  const hasCooldown = await redis.get(cooldownKey)
  if (hasCooldown) {
    throw new AppError(429, 'Please wait 60 seconds before requesting a new code.')
  }

  // Generate 6-digit code
  const code = generateOtp(6)
  const ttl = 600 // 10 minutes

  // Save to Redis
  const resetKey = `email:reset:${email}`
  await redis.set(resetKey, code, 'EX', ttl)

  // Save cooldown (60 seconds)
  await redis.set(cooldownKey, '1', 'EX', 60)

  // Send Email
  const subject = 'Reset Password Verification Code'
  const text = `Your verification code to reset your password is: ${code}. Valid for 10 minutes.`
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password for your Traditional Ao Dai account. Use the verification code below:</p>
      <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
        ${code}
      </div>
      <p>This code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
    </div>
  `

  await mailProvider.sendMail({ to: email, subject, text, html })

  return { success: true, message: 'VERIFICATION_CODE_SENT' }
}

export async function verifyResetPasswordEmailCode(input: VerifyResetPasswordEmailInput['body']) {
  const email = input.email.trim().toLowerCase()
  const { code } = input

  const resetKey = `email:reset:${email}`
  const savedCode = await redis.get(resetKey)

  if (!savedCode) {
    throw new AppError(400, 'Verification code has expired or does not exist. Please request a new one.')
  }

  if (savedCode !== code) {
    throw new AppError(400, 'Incorrect verification code. Please try again.')
  }

  const user = await prisma.user.findFirst({
    where: { email, role: 'CUSTOMER' },
  })

  if (!user) {
    throw new AppError(404, 'User with this email was not found.')
  }

  await redis.del(resetKey)
  await redis.del(`email:cooldown:RESET_PASSWORD:${email}`)

  return storeResetToken('email', email)
}

export async function verifyResetPasswordPhoneCode(input: VerifyResetPasswordPhoneInput['body']) {
  const normalizedPhone = normalizeVietnamPhone(input.phone)
  if (!normalizedPhone) {
    throw new AppError(400, 'Invalid phone number.')
  }

  await verifyOtp(normalizedPhone, 'RESET_PASSWORD', input.code)

  const user = await prisma.user.findFirst({
    where: { phone: normalizedPhone, role: 'CUSTOMER' },
  })

  if (!user) {
    throw new AppError(404, 'User with this phone number was not found.')
  }

  return storeResetToken('phone', normalizedPhone)
}

/**
 * Resets user password using the verification code sent to their email
 */
export async function resetPasswordByEmail(input: ResetPasswordEmailInput['body']): Promise<{ success: boolean }> {
  const email = input.email.trim().toLowerCase()
  const { code, password, resetToken } = input

  if (resetToken) {
    await consumeResetToken('email', resetToken, email)
  } else if (code) {
    const resetKey = `email:reset:${email}`
    const savedCode = await redis.get(resetKey)

    if (!savedCode) {
      throw new AppError(400, 'Verification code has expired or does not exist. Please request a new one.')
    }

    if (savedCode !== code) {
      throw new AppError(400, 'Incorrect verification code. Please try again.')
    }

    await redis.del(resetKey)
  } else {
    throw new AppError(400, 'Verification code or reset token is required.')
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: { email, role: 'CUSTOMER' },
  })

  if (!user) {
    throw new AppError(404, 'User with this email was not found.')
  }

  // Hash new password
  const hashedPassword = await hashPassword(password)

  // Update password and invalidate all sessions (for security)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.userSession.deleteMany({
      where: { userId: user.id },
    }),
  ])

  // Remove cooldown
  const cooldownKey = `email:cooldown:RESET_PASSWORD:${email}`
  await redis.del(cooldownKey)

  return { success: true }
}

/**
 * Resets user password using the SMS OTP verified code
 */
export async function resetPasswordByPhone(input: ResetPasswordPhoneInput['body']): Promise<{ success: boolean }> {
  const { phone, code, password, resetToken } = input

  const normalizedPhone = normalizeVietnamPhone(phone)
  if (!normalizedPhone) {
    throw new AppError(400, 'Invalid phone number.')
  }

  if (resetToken) {
    await consumeResetToken('phone', resetToken, normalizedPhone)
  } else if (code) {
    await verifyOtp(normalizedPhone, 'RESET_PASSWORD', code)
  } else {
    throw new AppError(400, 'OTP code or reset token is required.')
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: { phone: normalizedPhone, role: 'CUSTOMER' },
  })

  if (!user) {
    throw new AppError(404, 'User with this phone number was not found.')
  }

  // Hash new password
  const hashedPassword = await hashPassword(password)

  // Update password and invalidate all sessions (for security)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.userSession.deleteMany({
      where: { userId: user.id },
    }),
  ])

  return { success: true }
}




