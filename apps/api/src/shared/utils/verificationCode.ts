import { timingSafeEqual } from 'crypto'
import { redis } from './redis'
import { generateOtp } from './phone'
import { AppError } from '../middlewares/errorHandler'

/** Số lần nhập sai tối đa cho mỗi mã trước khi mã bị hủy */
export const MAX_VERIFICATION_ATTEMPTS = 5

export interface VerificationErrorKeys {
  /** Mã không tồn tại hoặc đã hết hạn */
  expired: string
  /** Mã nhập sai */
  incorrect: string
  /** Nhập sai quá số lần cho phép -> mã bị hủy */
  tooManyAttempts: string
}

function attemptsKey(codeKey: string) {
  return `${codeKey}:attempts`
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

/**
 * Sinh mã số mới, lưu vào Redis với TTL và reset bộ đếm số lần nhập sai
 */
export async function issueVerificationCode(codeKey: string, ttlSec: number, length = 6): Promise<string> {
  const code = generateOtp(length)
  await redis.multi().set(codeKey, code, 'EX', ttlSec).del(attemptsKey(codeKey)).exec()
  return code
}

/**
 * Xác minh mã số:
 * - Tăng bộ đếm số lần thử TRƯỚC khi so sánh (nguyên tử), nên gửi song song hàng loạt request cũng không vượt quá giới hạn
 * - Vượt quá MAX_VERIFICATION_ATTEMPTS -> hủy mã, buộc người dùng yêu cầu mã mới
 * - So sánh constant-time; đúng mã thì xóa mã để không dùng lại được
 */
export async function verifyVerificationCode(
  codeKey: string,
  code: string,
  errors: VerificationErrorKeys
): Promise<void> {
  const savedCode = await redis.get(codeKey)
  if (!savedCode) {
    throw new AppError(400, errors.expired)
  }

  const counterKey = attemptsKey(codeKey)
  const attempts = await redis.incr(counterKey)
  if (attempts === 1) {
    const ttl = await redis.ttl(codeKey)
    await redis.expire(counterKey, ttl > 0 ? ttl : 600)
  }

  if (attempts > MAX_VERIFICATION_ATTEMPTS) {
    await redis.del(codeKey, counterKey)
    throw new AppError(429, errors.tooManyAttempts)
  }

  if (!safeEqual(savedCode, code)) {
    if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
      await redis.del(codeKey, counterKey)
      throw new AppError(429, errors.tooManyAttempts)
    }
    throw new AppError(400, errors.incorrect)
  }

  await redis.del(codeKey, counterKey)
}
