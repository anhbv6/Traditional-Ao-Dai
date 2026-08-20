import { prisma } from '@repo/db'
import { AppError } from '../../shared/middlewares/errorHandler'
import { hashPassword, comparePassword } from '../../shared/utils/password'
import { OAuth2Client } from 'google-auth-library'
import { env } from '../../shared/config/env'

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID)

/**
 * Get customer user profile by ID
 */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { socialAccounts: true },
  })

  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(404, 'Không tìm thấy người dùng.')
  }

  if (!user.isActive) {
    throw new AppError(403, 'Tài khoản đã bị khóa hoặc ngừng hoạt động.')
  }

  const { password: _, ...safeUser } = user
  return safeUser
}

/**
 * Update customer user profile details
 */
export async function updateUserProfile(
  userId: string,
  payload: {
    name?: string;
    phone?: string | null;
    avatar?: string | null;
    dob?: string | null;
    gender?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(404, 'Không tìm thấy người dùng.')
  }
  if (!user.isActive) {
    throw new AppError(403, 'Tài khoản đã bị khóa hoặc ngừng hoạt động.')
  }

  const updateData: any = {}
  if (payload.name !== undefined) updateData.name = payload.name
  if (payload.avatar !== undefined) updateData.avatar = payload.avatar
  if (payload.dob !== undefined) {
    updateData.birth = payload.dob ? new Date(payload.dob) : null
  }
  if (payload.gender !== undefined) {
    const upperGender = payload.gender.toUpperCase()
    if (['MALE', 'FEMALE', 'OTHER'].includes(upperGender)) {
      updateData.gender = upperGender
    } else {
      throw new AppError(400, 'Giới tính không hợp lệ.')
    }
  }

  if (payload.phone !== undefined) {
    const trimmedPhone = payload.phone?.trim() || null
    if (trimmedPhone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: trimmedPhone,
          id: { not: userId },
        },
      })
      if (existingUser) {
        throw new AppError(400, 'Số điện thoại đã được sử dụng bởi tài khoản khác.')
      }
      updateData.phone = trimmedPhone
      updateData.isPhoneVerified = true
    } else {
      updateData.phone = null
      updateData.isPhoneVerified = false
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: { socialAccounts: true },
  })

  const { password: _, ...safeUser } = updatedUser
  return safeUser
}

/**
 * Change customer user login password
 */
export async function changeUserPassword(
  userId: string,
  payload: {
    currentPassword?: string;
    newPassword: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(404, 'Không tìm thấy người dùng.')
  }
  if (!user.isActive) {
    throw new AppError(403, 'Tài khoản đã bị khóa hoặc ngừng hoạt động.')
  }

  if (user.password) {
    if (!payload.currentPassword) {
      throw new AppError(400, 'Vui lòng cung cấp mật khẩu hiện tại.')
    }
    const isMatch = await comparePassword(payload.currentPassword, user.password)
    if (!isMatch) {
      throw new AppError(400, 'Mật khẩu hiện tại không chính xác.')
    }
  }

  const hashedPassword = await hashPassword(payload.newPassword)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })
}

/**
 * Link a Google social account to the local user account
 */
export async function linkGoogleAccount(userId: string, credential: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(404, 'Không tìm thấy người dùng.')
  }
  if (!user.isActive) {
    throw new AppError(403, 'Tài khoản đã bị khóa hoặc ngừng hoạt động.')
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch (error: any) {
    throw new AppError(400, `Xác thực Google thất bại: ${error.message}`)
  }

  if (!payload || !payload.sub) {
    throw new AppError(400, 'Token Google không hợp lệ.')
  }

  const providerId = payload.sub

  const existingLink = await prisma.socialAccount.findUnique({
    where: {
      provider_providerId: {
        provider: 'GOOGLE',
        providerId,
      },
    },
  })

  if (existingLink) {
    if (existingLink.userId === userId) {
      return
    } else {
      throw new AppError(400, 'Tài khoản Google này đã được liên kết với một tài khoản khác.')
    }
  }

  await prisma.socialAccount.create({
    data: {
      userId,
      provider: 'GOOGLE',
      providerId,
    },
  })
}

/**
 * Unlink Google account from local user account
 */
export async function unlinkGoogleAccount(userId: string, providerId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { socialAccounts: true },
  })
  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(404, 'Không tìm thấy người dùng.')
  }
  if (!user.isActive) {
    throw new AppError(403, 'Tài khoản đã bị khóa hoặc ngừng hoạt động.')
  }

  const targetLink = user.socialAccounts.find(
    (sa) => sa.provider === 'GOOGLE' && sa.providerId === providerId
  )

  if (!targetLink) {
    throw new AppError(404, 'Không tìm thấy liên kết Google tương ứng.')
  }

  const hasPassword = !!user.password
  const otherSocialCount = user.socialAccounts.length - 1

  if (!hasPassword && otherSocialCount === 0) {
    throw new AppError(
      400,
      'Bạn phải thiết lập mật khẩu hoặc liên kết tài khoản khác trước khi hủy liên kết Google.'
    )
  }

  await prisma.socialAccount.delete({
    where: { id: targetLink.id },
  })
}

/**
 * Get active user login sessions
 */
export async function getUserSessions(userId: string, currentSessionId?: string) {
  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return sessions.map((s) => ({
    id: s.id,
    device: s.deviceInfo || 'Unknown Device',
    ip: s.ipAddress || 'Unknown IP',
    createdAt: s.createdAt,
    isCurrent: s.id === currentSessionId,
  }))
}

/**
 * Revoke/Logout a specific user session
 */
export async function revokeUserSession(userId: string, sessionId: string) {
  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
  })

  if (!session) {
    throw new AppError(404, 'Không tìm thấy phiên đăng nhập hoặc phiên đã hết hạn.')
  }

  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  })
}