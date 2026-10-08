import { prisma } from '@repo/db'
import { AppError } from '../../shared/middlewares/errorHandler'
import { hashPassword, comparePassword } from '../../shared/utils/password'
import { normalizeVietnamPhone } from '../../shared/utils/phone'
import { revokeAllUserSessions } from '../../shared/utils/session'
import { redis } from '../../shared/utils/redis'
import { assertRateLimit } from '../../shared/utils/rateLimit'
import { sendVerificationCodeEmail } from '../../shared/utils/mail'
import { issueVerificationCode, verifyVerificationCode } from '../../shared/utils/verificationCode'
import { verifyGoogleCredential } from '../auth/client/auth.service'
import { deliverOtp, verifyOtp } from '../otp/otp.service'

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

async function getActiveCustomer(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(404, 'USER_NOT_FOUND')
  }

  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }

  return user
}

/**
 * Update customer user profile details.
 * Email & SĐT KHÔNG được đổi trực tiếp tại đây — phải qua luồng xác minh mã
 * (/user/email/verification, /user/phone/verification). Gửi lại đúng giá trị hiện tại thì được bỏ qua.
 */
export async function updateUserProfile(
  userId: string,
  payload: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
    dob?: string | null;
    gender?: string | number;
  }
) {
  const user = await getActiveCustomer(userId)

  const updateData: any = {}
  if (payload.name !== undefined) updateData.name = payload.name
  if (payload.avatar !== undefined) updateData.avatar = payload.avatar

  if (payload.email !== undefined) {
    const nextEmail = payload.email?.trim().toLowerCase() || null
    if (nextEmail && nextEmail !== user.email) {
      throw new AppError(400, 'EMAIL_CHANGE_REQUIRES_VERIFICATION')
    }
    if (!nextEmail && user.email) {
      // Gỡ email chỉ được phép khi vẫn còn SĐT đã xác minh để đăng nhập
      if (!user.phone || !user.isPhoneVerified) {
        throw new AppError(400, 'CANNOT_REMOVE_LAST_IDENTIFIER')
      }
      updateData.email = null
      updateData.isEmailVerified = false
    }
  }

  if (payload.phone !== undefined) {
    const nextPhone = normalizeVietnamPhone(payload.phone?.trim()) || null
    if (nextPhone && nextPhone !== user.phone) {
      throw new AppError(400, 'PHONE_CHANGE_REQUIRES_VERIFICATION')
    }
    if (!nextPhone && user.phone) {
      if (!user.email) {
        throw new AppError(400, 'CANNOT_REMOVE_LAST_IDENTIFIER')
      }
      updateData.phone = null
      updateData.isPhoneVerified = false
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

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: { socialAccounts: true },
  })

  const { password: _, ...safeUser } = updatedUser
  return safeUser
}

/**
 * Change customer user password.
 * Đăng xuất mọi phiên khác (giữ lại phiên hiện tại) — đề phòng mật khẩu cũ đã bị lộ.
 */
export async function changeUserPassword(
  userId: string,
  payload: {
    currentPassword?: string;
    newPassword: string;
  },
  currentSessionId?: string
) {
  const user = await getActiveCustomer(userId)

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

  await revokeAllUserSessions(userId, currentSessionId)
}

/**
 * Link Google Account to customer profile.
 * - Google phải xác minh email; mỗi tài khoản chỉ liên kết một tài khoản Google
 * - Nếu email Google trùng email tài khoản -> đánh dấu email tài khoản là đã xác minh (đã chứng minh sở hữu)
 */
export async function linkGoogleAccount(userId: string, credential: string) {
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

  const payload = await verifyGoogleCredential(credential)
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
    }
    throw new AppError(400, 'GOOGLE_ALREADY_LINKED')
  }

  if (user.socialAccounts.some((sa) => sa.provider === 'GOOGLE')) {
    throw new AppError(400, 'GOOGLE_PROVIDER_ALREADY_LINKED')
  }

  const provesEmailOwnership = !!user.email && user.email === payload.email && !user.isEmailVerified

  await prisma.$transaction([
    prisma.socialAccount.create({
      data: {
        userId,
        provider: 'GOOGLE',
        providerId,
      },
    }),
    ...(provesEmailOwnership
      ? [prisma.user.update({ where: { id: userId }, data: { isEmailVerified: true } })]
      : []),
  ])
}

/**
 * Unlink Google Account from customer profile
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

// ─── Contact Verification (xác minh / đổi Email & SĐT) ─────────────────────────

const CONTACT_CODE_TTL_SECONDS = 600
const CONTACT_EMAIL_COOLDOWN_SECONDS = 60
const CONTACT_EMAIL_DAILY_LIMIT = 10

const EMAIL_VERIFY_ERROR_KEYS = {
  expired: 'VERIFICATION_CODE_EXPIRED_OR_INVALID',
  incorrect: 'INCORRECT_VERIFICATION_CODE',
  tooManyAttempts: 'VERIFICATION_TOO_MANY_ATTEMPTS',
}

function emailVerifyCodeKey(userId: string, email: string) {
  return `email:verify:${userId}:${email}`
}

/**
 * Gửi mã xác minh tới email (email mới muốn đổi sang, hoặc email hiện tại chưa xác minh)
 */
export async function requestEmailVerification(userId: string, rawEmail: string) {
  const user = await getActiveCustomer(userId)
  const email = rawEmail.trim().toLowerCase()

  if (email === user.email && user.isEmailVerified) {
    throw new AppError(400, 'EMAIL_ALREADY_VERIFIED')
  }

  const emailOwner = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (emailOwner && emailOwner.id !== userId) {
    throw new AppError(400, 'EMAIL_ALREADY_EXISTS')
  }

  const cooldownKey = `email:cooldown:VERIFY_EMAIL:${userId}`
  if (await redis.get(cooldownKey)) {
    throw new AppError(429, 'COOLDOWN_ACTIVE')
  }

  await assertRateLimit(`email-daily:${email}`, CONTACT_EMAIL_DAILY_LIMIT, 24 * 60 * 60, 'EMAIL_DAILY_LIMIT_REACHED')

  const code = await issueVerificationCode(emailVerifyCodeKey(userId, email), CONTACT_CODE_TTL_SECONDS)
  await redis.set(cooldownKey, '1', 'EX', CONTACT_EMAIL_COOLDOWN_SECONDS)

  await sendVerificationCodeEmail({
    to: email,
    subject: 'Email Verification Code',
    heading: 'Verify your email',
    intro: 'Use the verification code below to confirm this email address for your Traditional Ao Dai account:',
    code,
    ttlMinutes: CONTACT_CODE_TTL_SECONDS / 60,
  })

  return { ttl: CONTACT_CODE_TTL_SECONDS }
}

/**
 * Xác nhận mã email -> cập nhật email (nếu là email mới) và đánh dấu đã xác minh
 */
export async function confirmEmailVerification(userId: string, rawEmail: string, code: string) {
  await getActiveCustomer(userId)
  const email = rawEmail.trim().toLowerCase()

  await verifyVerificationCode(emailVerifyCodeKey(userId, email), code, EMAIL_VERIFY_ERROR_KEYS)
  await redis.del(`email:cooldown:VERIFY_EMAIL:${userId}`)

  // Kiểm tra lại vì email có thể đã bị tài khoản khác lấy trong lúc chờ nhập mã
  const emailOwner = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (emailOwner && emailOwner.id !== userId) {
    throw new AppError(400, 'EMAIL_ALREADY_EXISTS')
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { email, isEmailVerified: true },
    include: { socialAccounts: true },
  })

  const { password: _, ...safeUser } = updatedUser
  return safeUser
}

/**
 * Gửi OTP tới SĐT (SĐT mới muốn đổi sang, hoặc SĐT hiện tại chưa xác minh)
 */
export async function requestPhoneVerification(userId: string, rawPhone: string) {
  const user = await getActiveCustomer(userId)
  const phone = normalizeVietnamPhone(rawPhone.trim())
  if (!phone) {
    throw new AppError(400, 'INVALID_PHONE_NUMBER')
  }

  if (phone === user.phone && user.isPhoneVerified) {
    throw new AppError(400, 'PHONE_ALREADY_VERIFIED')
  }

  const phoneOwner = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, isPhoneVerified: true },
  })
  if (phoneOwner && phoneOwner.id !== userId && phoneOwner.isPhoneVerified) {
    throw new AppError(400, 'PHONE_ALREADY_EXISTS')
  }

  // Mã gắn với userId để chỉ đúng người yêu cầu mới xác nhận được
  return deliverOtp(phone, 'VERIFY_PHONE', `${userId}:${phone}`)
}

/**
 * Xác nhận OTP -> cập nhật SĐT và đánh dấu đã xác minh.
 * Nếu tài khoản khác đang giữ SĐT này ở trạng thái CHƯA xác minh thì SĐT được chuyển sang người vừa chứng minh sở hữu.
 */
export async function confirmPhoneVerification(userId: string, rawPhone: string, code: string) {
  await getActiveCustomer(userId)
  const phone = normalizeVietnamPhone(rawPhone.trim())
  if (!phone) {
    throw new AppError(400, 'INVALID_PHONE_NUMBER')
  }

  await verifyOtp(phone, 'VERIFY_PHONE', code, `${userId}:${phone}`)

  const updatedUser = await prisma.$transaction(async (tx) => {
    const phoneOwner = await tx.user.findUnique({
      where: { phone },
      select: { id: true, isPhoneVerified: true },
    })

    if (phoneOwner && phoneOwner.id !== userId) {
      if (phoneOwner.isPhoneVerified) {
        throw new AppError(400, 'PHONE_ALREADY_EXISTS')
      }
      await tx.user.update({
        where: { id: phoneOwner.id },
        data: { phone: null, isPhoneVerified: false },
      })
    }

    return tx.user.update({
      where: { id: userId },
      data: { phone, isPhoneVerified: true },
      include: { socialAccounts: true },
    })
  })

  const { password: _, ...safeUser } = updatedUser
  return safeUser
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
