import { prisma } from '@repo/db'
import { createHash } from 'crypto'
import { comparePassword, hashPassword } from '../../../shared/utils/password'
import { generateAccessToken, generateRefreshToken, JWTPayload, verifyToken } from '../../../shared/utils/jwt'
import { AppError } from '../../../shared/middlewares/errorHandler'
import { env } from '../../../shared/config/env'
import { LoginInput, RefreshTokenInput, RegisterInput } from '../auth.schema'

interface SessionMeta {
  deviceInfo?: string
  ipAddress?: string
}

function durationToMs(duration: string): number {
  const match = duration.trim().match(/^(\d+)(ms|s|m|h|d|w)?$/)
  if (!match) {
    throw new AppError(500, 'Invalid refresh token expiration config')
  }

  const value = Number(match[1])
  const unit = match[2] ?? 'ms'
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  }

  return value * multipliers[unit]
}

function buildAuthTokens(user: { id: string; role: JWTPayload['role'] }, sessionId: string) {
  const payload = {
    userId: user.id,
    role: user.role,
    sessionId,
  }

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function normalizeVietnamPhone(phone?: string | null) {
  if (!phone) {
    return phone
  }

  return phone.startsWith('+84') ? `0${phone.slice(3)}` : phone
}

/**
 * Validates client credentials and generates a JWT access token.
 */
export async function clientLogin(input: LoginInput['body'], meta: SessionMeta = {}) {
  const emailOrPhone = input.email.trim()
  const password = input.password

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

  const refreshExpiresAt = new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN))
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshToken: '',
      deviceInfo: meta.deviceInfo,
      ipAddress: meta.ipAddress,
      expiresAt: refreshExpiresAt,
    },
  })

  const tokens = buildAuthTokens(user, session.id)

  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      refreshToken: hashToken(tokens.refreshToken),
    },
  })

  // Return user info excluding password and include token
  const { password: _, ...safeUser } = user
  return {
    ...tokens,
    refreshTokenExpiresAt: refreshExpiresAt,
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

  if (decoded.tokenType !== 'refresh' || !decoded.sessionId) {
    throw new AppError(401, 'Invalid refresh token type')
  }

  const session = await prisma.userSession.findFirst({
    where: {
      id: decoded.sessionId,
      userId: decoded.userId,
      refreshToken: hashToken(input.refreshToken),
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  })

  if (!session || !session.user.isActive || session.user.role !== 'CUSTOMER') {
    throw new AppError(401, 'Session expired or revoked')
  }

  const refreshExpiresAt = new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN))
  const tokens = buildAuthTokens(session.user, session.id)

  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      refreshToken: hashToken(tokens.refreshToken),
      expiresAt: refreshExpiresAt,
    },
  })

  const { password: _, ...safeUser } = session.user
  return {
    ...tokens,
    refreshTokenExpiresAt: refreshExpiresAt,
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
 * Registers a new client (customer).
 */
export async function clientRegister(input: RegisterInput['body']) {
  const { registerType, password, name } = input
  let finalEmail = ''
  let finalPhone: string | null = null

  if (registerType === 'email') {
    const { email, phone } = input
    finalEmail = email.trim().toLowerCase()
    finalPhone = normalizeVietnamPhone(phone) || null

    // Check email conflict
    const existingUser = await prisma.user.findUnique({
      where: { email: finalEmail },
    })
    if (existingUser) {
      throw new AppError(400, 'Email này đã được đăng ký sử dụng')
    }
  } else {
    const { phone, email } = input
    finalPhone = normalizeVietnamPhone(phone)!
    finalEmail = email ? email.trim().toLowerCase() : `${finalPhone}@aodai.local`

    // Check dummy email conflict
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: finalEmail },
    })
    if (existingEmailUser) {
      throw new AppError(400, 'Số điện thoại này đã được đăng ký sử dụng (mã định danh trùng lặp)')
    }
  }

  // Check phone conflict if provided
  if (finalPhone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: finalPhone },
    })
    if (existingPhone) {
      throw new AppError(400, 'Số điện thoại này đã được đăng ký sử dụng')
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
    },
  })
  return user
}

/**
 * Retrieves a user by their unique database identifier.
 */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(404, 'Không tìm thấy người dùng')
  }

  if (!user.isActive) {
    throw new AppError(403, 'TÃ i khoáº£n nÃ y Ä‘Ã£ bá»‹ khÃ³a hoáº·c ngÆ°ng hoáº¡t Ä‘á»™ng')
  }

  const { password: _, ...safeUser } = user
  return safeUser
}

interface CheckAccountResult {
  available: boolean
  reason: 'EMAIL_TAKEN' | 'PHONE_TAKEN' | 'AVAILABLE'
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
        throw new AppError(400, 'Số điện thoại này đã được đăng ký sử dụng bởi tài khoản khác')
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




