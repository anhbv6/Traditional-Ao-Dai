import { redis } from '../../shared/utils/redis'
import { smsProvider } from '../../shared/utils/sms'
import { env } from '../../shared/config/env'
import { AppError } from '../../shared/middlewares/errorHandler'
import { normalizeVietnamPhone } from '../../shared/utils/phone'

export function generateOtp(length = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}

export async function sendOtp(phone: string, purpose: string): Promise<{ success: boolean; ttl: number }> {
  const normalizedPhone = normalizeVietnamPhone(phone)
  if (!normalizedPhone) {
    throw new AppError(400, 'Số điện thoại không hợp lệ.')
  }

  const cooldownKey = `otp:cooldown:${purpose}:${normalizedPhone}`
  const otpKey = `otp:${purpose}:${normalizedPhone}`

  // Check cooldown
  const hasCooldown = await redis.get(cooldownKey)
  if (hasCooldown) {
    throw new AppError(429, 'Vui lòng đợi 60 giây trước khi yêu cầu mã OTP mới.')
  }

  // Generate OTP code
  const code = generateOtp(6)
  const ttl = env.OTP_TTL_SECONDS

  // Save code to Redis
  await redis.set(otpKey, code, 'EX', ttl)

  // Save cooldown to Redis (60 seconds)
  await redis.set(cooldownKey, '1', 'EX', 60)

  // Send via SMS provider
  const message = `Mã OTP của bạn là: ${code}. Mã có hiệu lực trong ${Math.floor(ttl / 60)} phút.`
  await smsProvider.sendSms(normalizedPhone, message)

  return { success: true, ttl }
}

export async function verifyOtp(phone: string, purpose: string, code: string): Promise<boolean> {
  const normalizedPhone = normalizeVietnamPhone(phone)
  if (!normalizedPhone) {
    throw new AppError(400, 'Số điện thoại không hợp lệ.')
  }

  const otpKey = `otp:${purpose}:${normalizedPhone}`

  // Retrieve code from Redis
  const savedCode = await redis.get(otpKey)
  if (!savedCode) {
    throw new AppError(400, 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã mới.')
  }

  if (savedCode !== code) {
    throw new AppError(400, 'Mã OTP không chính xác. Vui lòng thử lại.')
  }

  // OTP verified successfully, delete it to prevent reuse
  await redis.del(otpKey)

  // Also remove cooldown so they can request a new one if needed
  const cooldownKey = `otp:cooldown:${purpose}:${normalizedPhone}`
  await redis.del(cooldownKey)

  return true
}
