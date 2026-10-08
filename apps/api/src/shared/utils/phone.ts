import { randomInt } from 'crypto'

// Chuẩn hóa SĐT dùng chung với Frontend
export { normalizeVietnamPhone } from '@repo/shared'

/**
 * Sinh mã OTP gồm `length` chữ số bằng bộ sinh số ngẫu nhiên an toàn mật mã (CSPRNG)
 */
export function generateOtp(length = 6): string {
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += randomInt(0, 10).toString()
  }
  return otp
}