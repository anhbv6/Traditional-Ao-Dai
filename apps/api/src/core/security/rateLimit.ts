import { redis } from '../../infra/redis'
import { AppError } from '../http/AppError'

interface RateLimitResult {
  allowed: boolean
  retryAfter: number
}

/**
 * Đếm số lần gọi trong một cửa sổ thời gian cố định (fixed window) bằng Redis INCR.
 * Fail-open khi Redis lỗi để không làm sập toàn bộ API (các luồng OTP vốn đã phụ thuộc Redis).
 */
export async function consumeRateLimit(
  key: string,
  max: number,
  windowSec: number
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`
  try {
    const results = await redis
      .multi()
      .incr(redisKey)
      .expire(redisKey, windowSec, 'NX')
      .ttl(redisKey)
      .exec()

    const count = Number(results?.[0]?.[1] ?? 0)
    const ttl = Number(results?.[2]?.[1] ?? windowSec)

    return {
      allowed: count <= max,
      retryAfter: ttl > 0 ? ttl : windowSec,
    }
  } catch (error) {
    console.error('[RateLimit] Redis error, fail-open:', error)
    return { allowed: true, retryAfter: 0 }
  }
}

/**
 * Hoàn lại 1 lượt đã đếm (dùng khi request thành công không nên tính vào hạn mức)
 */
export async function refundRateLimit(key: string): Promise<void> {
  try {
    await redis.decr(`ratelimit:${key}`)
  } catch (error) {
    console.error('[RateLimit] Redis error khi hoàn lượt:', error)
  }
}

/**
 * Ném lỗi 429 nếu vượt hạn mức (dùng bên trong service, ví dụ hạn mức gửi SMS/Email theo ngày)
 */
export async function assertRateLimit(
  key: string,
  max: number,
  windowSec: number,
  message = 'TOO_MANY_REQUESTS'
): Promise<void> {
  const result = await consumeRateLimit(key, max, windowSec)
  if (!result.allowed) {
    throw new AppError(429, message)
  }
}
