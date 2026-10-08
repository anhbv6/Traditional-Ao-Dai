import { prisma } from '@repo/db'
import { redis } from '../../shared/utils/redis'
import { smsProvider } from '../../shared/utils/sms'
import { env } from '../../shared/config/env'
import { AppError } from '../../shared/middlewares/errorHandler'
import { normalizeVietnamPhone } from '../../shared/utils/phone'
import { assertRateLimit } from '../../shared/utils/rateLimit'
import { issueVerificationCode, verifyVerificationCode } from '../../shared/utils/verificationCode'

export type OtpPurpose = 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD' | 'VERIFY_PHONE'

/** Thời gian chờ giữa 2 lần gửi OTP cho cùng một SĐT + mục đích */
const OTP_COOLDOWN_SECONDS = 60
/** Hạn mức SMS tối đa gửi tới một SĐT mỗi ngày (chống SMS pumping / spam) */
const OTP_DAILY_LIMIT_PER_PHONE = 10

export const OTP_ERROR_KEYS = {
  expired: 'OTP_EXPIRED_OR_NOT_FOUND',
  incorrect: 'OTP_INCORRECT',
  tooManyAttempts: 'OTP_TOO_MANY_ATTEMPTS',
}

function otpKey(purpose: OtpPurpose, target: string) {
  return `otp:${purpose}:${target}`
}

function cooldownKey(purpose: OtpPurpose, target: string) {
  return `otp:cooldown:${purpose}:${target}`
}

/**
 * Gửi mã OTP tới SĐT (dùng chung cho mọi mục đích).
 * @param scope Phạm vi lưu mã, mặc định là SĐT. Luồng VERIFY_PHONE truyền thêm userId để mã gắn với đúng người yêu cầu.
 */
export async function deliverOtp(
  normalizedPhone: string,
  purpose: OtpPurpose,
  scope: string = normalizedPhone
): Promise<{ success: boolean; ttl: number }> {
  const ttl = env.OTP_TTL_SECONDS

  if (await redis.get(cooldownKey(purpose, scope))) {
    throw new AppError(429, 'OTP_COOLDOWN_ACTIVE')
  }

  await assertRateLimit(`otp-daily:${normalizedPhone}`, OTP_DAILY_LIMIT_PER_PHONE, 24 * 60 * 60, 'OTP_DAILY_LIMIT_REACHED')

  const code = await issueVerificationCode(otpKey(purpose, scope), ttl)
  await redis.set(cooldownKey(purpose, scope), '1', 'EX', OTP_COOLDOWN_SECONDS)

  const message = `Your AODAI OTP code is: ${code}. Valid for ${Math.floor(ttl / 60)} minutes.`
  await smsProvider.sendSms(normalizedPhone, message)

  return { success: true, ttl }
}

/**
 * Gửi OTP cho các luồng công khai (đăng ký, đăng nhập, quên mật khẩu)
 */
export async function sendOtp(phone: string, purpose: Exclude<OtpPurpose, 'VERIFY_PHONE'>): Promise<{ success: boolean; ttl: number }> {
  const normalizedPhone = normalizeVietnamPhone(phone)
  if (!normalizedPhone) {
    throw new AppError(400, 'INVALID_PHONE_NUMBER')
  }

  const existingUser = await prisma.user.findFirst({
    where: { phone: normalizedPhone },
    select: { id: true, role: true, isPhoneVerified: true },
  })
  const isRegisteredCustomer = existingUser?.role === 'CUSTOMER'
  // Chỉ SĐT đã xác minh mới được dùng để đăng nhập OTP / đặt lại mật khẩu
  const canUsePhoneAuth = isRegisteredCustomer && existingUser?.isPhoneVerified === true

  if (purpose === 'REGISTER' && existingUser?.isPhoneVerified) {
    // Không gửi SMS vô ích cho số đã được đăng ký & xác minh.
    // SĐT chỉ khai báo (chưa xác minh) ở tài khoản khác vẫn được gửi OTP để chủ thật nhận lại số.
    throw new AppError(400, 'PHONE_ALREADY_EXISTS')
  }

  if (purpose === 'LOGIN') {
    if (!isRegisteredCustomer) {
      throw new AppError(404, 'USER_NOT_FOUND')
    }
    if (!canUsePhoneAuth) {
      throw new AppError(400, 'PHONE_NOT_VERIFIED')
    }
  }

  if (purpose === 'RESET_PASSWORD' && !canUsePhoneAuth) {
    // Không tiết lộ SĐT có tồn tại hay không: phản hồi giống hệt trường hợp thành công nhưng không gửi SMS
    if (await redis.get(cooldownKey(purpose, normalizedPhone))) {
      throw new AppError(429, 'OTP_COOLDOWN_ACTIVE')
    }
    await redis.set(cooldownKey(purpose, normalizedPhone), '1', 'EX', OTP_COOLDOWN_SECONDS)
    return { success: true, ttl: env.OTP_TTL_SECONDS }
  }

  return deliverOtp(normalizedPhone, purpose)
}

/**
 * Xác minh OTP (giới hạn số lần nhập sai, đúng mã thì hủy mã)
 */
export async function verifyOtp(
  phone: string,
  purpose: OtpPurpose,
  code: string,
  scope?: string
): Promise<boolean> {
  const normalizedPhone = normalizeVietnamPhone(phone)
  if (!normalizedPhone) {
    throw new AppError(400, 'INVALID_PHONE_NUMBER')
  }

  const target = scope ?? normalizedPhone
  await verifyVerificationCode(otpKey(purpose, target), code, OTP_ERROR_KEYS)

  // Cho phép yêu cầu mã mới ngay sau khi đã dùng mã thành công
  await redis.del(cooldownKey(purpose, target))

  return true
}
