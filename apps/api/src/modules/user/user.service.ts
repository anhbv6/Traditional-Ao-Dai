import { prisma, type Prisma } from '@repo/db'
import { normalizeEmail, type AuthProvider } from '@repo/shared'
import { AppError } from '../../core/http/AppError'
import { hashPassword, comparePassword } from '../../core/security/password'
import { normalizeVietnamPhone } from '../../core/utils/phone'
import { revokeAllUserSessions } from '../../core/security/session'
import { redis } from '../../infra/redis'
import { assertRateLimit } from '../../core/security/rateLimit'
import { sendVerificationCodeEmail } from '../../infra/mailer'
import { issueVerificationCode, verifyVerificationCode } from '../../core/security/verificationCode'
import { verifyGoogleCredential } from '../auth/client/auth.service'
import { deliverOtp, verifyOtp } from '../otp/otp.service'
import { toUserDto, USER_DTO_INCLUDE } from './user.mapper'
import { type UpdateProfileInput } from './user.schema'

/**
 * Lấy tài khoản đang hoạt động (mọi vai trò — STAFF/ADMIN cũng có hồ sơ mua hàng)
 */
async function getActiveUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: USER_DTO_INCLUDE })

  if (!user || user.status === 'DELETED') {
    throw new AppError(404, 'USER_NOT_FOUND')
  }
  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }

  return user
}

/**
 * Hồ sơ của người dùng hiện tại (GET /auth/me)
 */
export async function getProfile(userId: string) {
  return toUserDto(await getActiveUser(userId))
}

/**
 * Cập nhật thông tin cá nhân (tên, ảnh đại diện, ngày sinh, giới tính)
 */
export async function updateUserProfile(userId: string, payload: UpdateProfileInput) {
  await getActiveUser(userId)

  const data: Prisma.UserUpdateInput = {}
  if (payload.name !== undefined) data.name = payload.name
  if (payload.avatarUrl !== undefined) data.avatarUrl = payload.avatarUrl
  if (payload.birthDate !== undefined) data.birthDate = payload.birthDate ? new Date(payload.birthDate) : null
  if (payload.gender !== undefined) data.gender = payload.gender

  const updated = await prisma.user.update({ where: { id: userId }, data, include: USER_DTO_INCLUDE })
  return toUserDto(updated)
}

/**
 * Đổi mật khẩu (hoặc đặt mật khẩu lần đầu cho tài khoản chỉ đăng nhập Google).
 * Đăng xuất mọi phiên khác ở mọi khu (giữ lại phiên hiện tại) — đề phòng mật khẩu cũ đã bị lộ.
 */
export async function changeUserPassword(
  userId: string,
  payload: { currentPassword?: string; newPassword: string },
  currentSessionId?: string
) {
  const user = await getActiveUser(userId)

  if (user.passwordHash) {
    if (!payload.currentPassword) {
      throw new AppError(400, 'CURRENT_PASSWORD_REQUIRED')
    }
    if (!(await comparePassword(payload.currentPassword, user.passwordHash))) {
      throw new AppError(400, 'CURRENT_PASSWORD_INCORRECT')
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(payload.newPassword), passwordChangedAt: new Date() },
  })

  await revokeAllUserSessions(userId, currentSessionId)
}

// ─── Liên kết mạng xã hội ───────────────────────────────────────────────────────

/**
 * Liên kết tài khoản Google vào hồ sơ.
 * - Google phải xác minh email; mỗi tài khoản chỉ liên kết một tài khoản Google
 * - Email Google trùng email tài khoản (chưa xác minh) -> đánh dấu email đã xác minh (đã chứng minh sở hữu)
 */
export async function linkGoogleAccount(userId: string, credential: string) {
  const user = await getActiveUser(userId)
  const payload = await verifyGoogleCredential(credential)

  const existingLink = await prisma.socialAccount.findUnique({
    where: { provider_providerUserId: { provider: 'GOOGLE', providerUserId: payload.sub } },
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

  const provesEmailOwnership = !!user.email && user.email === payload.email && !user.emailVerifiedAt

  await prisma.$transaction([
    prisma.socialAccount.create({
      data: { userId, provider: 'GOOGLE', providerUserId: payload.sub, email: payload.email },
    }),
    ...(provesEmailOwnership
      ? [prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } })]
      : []),
  ])
}

/**
 * Gỡ liên kết mạng xã hội — không cho gỡ phương thức đăng nhập cuối cùng
 */
export async function unlinkSocialAccount(userId: string, provider: AuthProvider) {
  const user = await getActiveUser(userId)

  const target = user.socialAccounts.find((sa) => sa.provider === provider)
  if (!target) {
    throw new AppError(404, 'SOCIAL_ACCOUNT_NOT_FOUND')
  }

  const hasOtherSignIn =
    !!user.passwordHash || !!user.phoneVerifiedAt || user.socialAccounts.length > 1
  if (!hasOtherSignIn) {
    throw new AppError(400, 'CANNOT_UNLINK_ONLY_SIGNIN_METHOD')
  }

  await prisma.socialAccount.delete({ where: { id: target.id } })
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

function emailVerifyCooldownKey(userId: string) {
  return `email:cooldown:VERIFY_EMAIL:${userId}`
}

/**
 * Gửi mã xác minh tới email (email mới muốn đổi sang, hoặc email hiện tại chưa xác minh)
 */
export async function requestEmailVerification(userId: string, rawEmail: string) {
  const user = await getActiveUser(userId)
  const email = normalizeEmail(rawEmail)

  if (email === user.email && user.emailVerifiedAt) {
    throw new AppError(400, 'EMAIL_ALREADY_VERIFIED')
  }

  const emailOwner = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (emailOwner && emailOwner.id !== userId) {
    throw new AppError(400, 'EMAIL_ALREADY_EXISTS')
  }

  const cooldownKey = emailVerifyCooldownKey(userId)
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
  await getActiveUser(userId)
  const email = normalizeEmail(rawEmail)

  await verifyVerificationCode(emailVerifyCodeKey(userId, email), code, EMAIL_VERIFY_ERROR_KEYS)
  await redis.del(emailVerifyCooldownKey(userId))

  // Kiểm tra lại vì email có thể đã bị tài khoản khác lấy trong lúc chờ nhập mã
  const emailOwner = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (emailOwner && emailOwner.id !== userId) {
    throw new AppError(400, 'EMAIL_ALREADY_EXISTS')
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { email, emailVerifiedAt: new Date() },
    include: USER_DTO_INCLUDE,
  })
  return toUserDto(updated)
}

/**
 * Gửi OTP tới SĐT (SĐT mới muốn đổi sang, hoặc SĐT hiện tại chưa xác minh)
 */
export async function requestPhoneVerification(userId: string, rawPhone: string) {
  const user = await getActiveUser(userId)
  const phone = normalizeVietnamPhone(rawPhone.trim())
  if (!phone) {
    throw new AppError(400, 'INVALID_PHONE_NUMBER')
  }

  if (phone === user.phone && user.phoneVerifiedAt) {
    throw new AppError(400, 'PHONE_ALREADY_VERIFIED')
  }

  const phoneOwner = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, phoneVerifiedAt: true },
  })
  if (phoneOwner && phoneOwner.id !== userId && phoneOwner.phoneVerifiedAt) {
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
  await getActiveUser(userId)
  const phone = normalizeVietnamPhone(rawPhone.trim())
  if (!phone) {
    throw new AppError(400, 'INVALID_PHONE_NUMBER')
  }

  await verifyOtp(phone, 'VERIFY_PHONE', code, `${userId}:${phone}`)

  const updated = await prisma.$transaction(async (tx) => {
    const phoneOwner = await tx.user.findUnique({
      where: { phone },
      select: { id: true, phoneVerifiedAt: true },
    })

    if (phoneOwner && phoneOwner.id !== userId) {
      if (phoneOwner.phoneVerifiedAt) {
        throw new AppError(400, 'PHONE_ALREADY_EXISTS')
      }
      await tx.user.update({ where: { id: phoneOwner.id }, data: { phone: null } })
    }

    return tx.user.update({
      where: { id: userId },
      data: { phone, phoneVerifiedAt: new Date() },
      include: USER_DTO_INCLUDE,
    })
  })

  return toUserDto(updated)
}

// ─── Phiên đăng nhập ────────────────────────────────────────────────────────────

/**
 * Danh sách phiên còn hiệu lực ở MỌI khu (storefront + quản trị) để người dùng tự rà soát thiết bị lạ
 */
export async function getUserSessions(userId: string, currentSessionId?: string) {
  const sessions = await prisma.userSession.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: 'desc' },
  })

  return sessions.map((s) => ({
    id: s.id,
    kind: s.kind,
    device: s.userAgent || 'Unknown Device',
    ip: s.ipAddress || 'Unknown IP',
    createdAt: s.createdAt,
    lastUsedAt: s.lastUsedAt,
    isCurrent: s.id === currentSessionId,
  }))
}

/**
 * Thu hồi một phiên đăng nhập (đăng xuất thiết bị khác)
 */
export async function revokeUserSession(userId: string, sessionId: string) {
  const { count } = await prisma.userSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })

  if (count === 0) {
    throw new AppError(404, 'SESSION_NOT_FOUND')
  }
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
