import { prisma } from '@repo/db'
import { AppError } from '../../shared/middlewares/errorHandler'
import { hashPassword, comparePassword } from '../../shared/utils/password'
import { OAuth2Client } from 'google-auth-library'
import { env } from '../../shared/config/env'
import { normalizeVietnamPhone } from '../../shared/utils/phone'

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID)

/**
 * Get customer user profile by ID
 */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { socialAccounts: true, staffPermission: true },
  })

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND')
  }

  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
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
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
    dob?: string | null;
    gender?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(404, 'USER_NOT_FOUND')
  }
  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }

  const updateData: any = {}
  if (payload.name !== undefined) updateData.name = payload.name
  if (payload.avatar !== undefined) updateData.avatar = payload.avatar
  if (payload.email !== undefined) {
    const trimmedEmail = payload.email?.trim().toLowerCase() || null
    if (trimmedEmail) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: trimmedEmail,
          id: { not: userId },
        },
      })
      if (existingUser) {
        throw new AppError(400, 'EMAIL_ALREADY_EXISTS')
      }
      updateData.email = trimmedEmail
      updateData.isEmailVerified = true
    } else {
      updateData.email = null
      updateData.isEmailVerified = false
    }
  }
  if (payload.dob !== undefined) {
    updateData.birth = payload.dob ? new Date(payload.dob) : null
  }
  if (payload.gender !== undefined) {
    let genderVal: number | null = null
    if (typeof payload.gender === 'number') {
      if ([0, 1, 2].includes(payload.gender)) genderVal = payload.gender
    } else if (typeof payload.gender === 'string') {
      const g = payload.gender.trim().toUpperCase()
      if (g === '0' || g === 'MALE') genderVal = 0
      else if (g === '1' || g === 'FEMALE') genderVal = 1
      else if (g === '2' || g === 'OTHER') genderVal = 2
    }

    if (genderVal !== null) {
      updateData.gender = genderVal
    } else {
      throw new AppError(400, 'GENDER_INVALID')
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
        throw new AppError(400, 'PHONE_ALREADY_EXISTS')
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
    throw new AppError(404, 'USER_NOT_FOUND')
  }
  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }

  if (user.password) {
    if (!payload.currentPassword) {
      throw new AppError(400, 'CURRENT_PASSWORD_REQUIRED')
    }
    const isMatch = await comparePassword(payload.currentPassword, user.password)
    if (!isMatch) {
      throw new AppError(400, 'CURRENT_PASSWORD_INCORRECT')
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
    throw new AppError(404, 'USER_NOT_FOUND')
  }
  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch (error: any) {
    throw new AppError(400, 'GOOGLE_AUTH_FAILED')
  }

  if (!payload || !payload.sub) {
    throw new AppError(400, 'GOOGLE_TOKEN_INVALID')
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
      throw new AppError(400, 'GOOGLE_ALREADY_LINKED')
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
    throw new AppError(404, 'USER_NOT_FOUND')
  }
  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }

  const targetLink = user.socialAccounts.find(
    (sa) => sa.provider === 'GOOGLE' && sa.providerId === providerId
  )

  if (!targetLink) {
    throw new AppError(404, 'SOCIAL_ACCOUNT_NOT_FOUND')
  }

  const hasPassword = !!user.password
  const otherSocialCount = user.socialAccounts.length - 1

  if (!hasPassword && otherSocialCount === 0) {
    throw new AppError(
      400,
      'CANNOT_UNLINK_ONLY_SIGNIN_METHOD'
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
    throw new AppError(404, 'SESSION_NOT_FOUND')
  }

  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  })
}

// ─── Address Service ────────────────────────────────────────────────────────────

/**
 * Get all addresses of a user
 */
export async function getUserAddresses(userId: string) {
  return prisma.userAddress.findMany({
    where: { userId },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  })
}

/**
 * Create a new address for a user
 */
export async function createUserAddress(
  userId: string,
  payload: {
    receiverName: string
    receiverPhone: string
    addressLine: string
    provinceCode?: string | null
    provinceName?: string | null
    districtCode?: string | null
    districtName?: string | null
    wardCode?: string | null
    wardName?: string | null
    postalCode?: string | null
    label?: string | null
    isDefault?: boolean
  }
) {
  // 1. Max 10 addresses limit
  const count = await prisma.userAddress.count({ where: { userId } })
  if (count >= 10) {
    throw new AppError(400, 'MAX_ADDRESS_LIMIT_REACHED')
  }

  // If first address, it must be default
  const isDefault = count === 0 ? true : !!payload.isDefault

  return prisma.$transaction(async (tx) => {
    // If setting as default, unset others first
    if (isDefault) {
      await tx.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      })
    }

    return tx.userAddress.create({
      data: {
        userId,
        receiverName: payload.receiverName,
        receiverPhone: normalizeVietnamPhone(payload.receiverPhone)!,
        addressLine: payload.addressLine,
        provinceCode: payload.provinceCode,
        provinceName: payload.provinceName,
        districtCode: payload.districtCode,
        districtName: payload.districtName,
        wardCode: payload.wardCode,
        wardName: payload.wardName,
        postalCode: payload.postalCode,
        label: payload.label,
        isDefault,
      },
    })
  })
}

/**
 * Update an existing address of a user
 */
export async function updateUserAddress(
  userId: string,
  addressId: string,
  payload: {
    receiverName?: string
    receiverPhone?: string
    addressLine?: string
    provinceCode?: string | null
    provinceName?: string | null
    districtCode?: string | null
    districtName?: string | null
    wardCode?: string | null
    wardName?: string | null
    postalCode?: string | null
    label?: string | null
    isDefault?: boolean
  }
) {
  // Find target address
  const target = await prisma.userAddress.findFirst({
    where: { id: addressId, userId },
  })

  if (!target) {
    throw new AppError(404, 'ADDRESS_NOT_FOUND')
  }

  // Handle default logic. A user should always have one default address while any address remains.
  let isDefault = payload.isDefault !== undefined ? payload.isDefault : target.isDefault

  // If the current default is unset without another default available, keep it as default.
  if (!isDefault && target.isDefault) {
    const otherDefaultCount = await prisma.userAddress.count({
      where: {
        userId,
        id: { not: addressId },
        isDefault: true,
      },
    })
    if (otherDefaultCount === 0) {
      isDefault = true
    }
  }

  return prisma.$transaction(async (tx) => {
    if (isDefault && !target.isDefault) {
      // Unset previous defaults
      await tx.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      })
    }

    return tx.userAddress.update({
      where: { id: addressId },
      data: {
        receiverName: payload.receiverName,
        receiverPhone: payload.receiverPhone !== undefined ? normalizeVietnamPhone(payload.receiverPhone)! : undefined,
        addressLine: payload.addressLine,
        provinceCode: payload.provinceCode,
        provinceName: payload.provinceName,
        districtCode: payload.districtCode,
        districtName: payload.districtName,
        wardCode: payload.wardCode,
        wardName: payload.wardName,
        postalCode: payload.postalCode,
        label: payload.label,
        isDefault,
      },
    })
  })
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(userId: string, addressId: string) {
  const target = await prisma.userAddress.findFirst({
    where: { id: addressId, userId },
  })

  if (!target) {
    throw new AppError(404, 'ADDRESS_NOT_FOUND')
  }

  if (target.isDefault) {
    return target
  }

  return prisma.$transaction(async (tx) => {
    // Unset all other defaults
    await tx.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    })

    // Set this one as default
    return tx.userAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    })
  })
}

/**
 * Delete an address
 */
export async function deleteUserAddress(userId: string, addressId: string) {
  const target = await prisma.userAddress.findFirst({
    where: { id: addressId, userId },
  })

  if (!target) {
    throw new AppError(404, 'ADDRESS_NOT_FOUND')
  }

  return prisma.$transaction(async (tx) => {
    // Delete target address
    await tx.userAddress.delete({
      where: { id: addressId },
    })

    // If it was default, find another one to make default
    if (target.isDefault) {
      const nextDefault = await tx.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      if (nextDefault) {
        await tx.userAddress.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        })
      }
    }
  })
}
