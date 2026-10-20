import { Request, Response, NextFunction } from 'express'
import { redis } from './redis'
import { AppError } from '../middlewares/errorHandler'

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
async function refundRateLimit(key: string): Promise<void> {
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

interface RateLimitOptions {
  /** Tên nhóm giới hạn, dùng làm tiền tố key Redis */
  name: string
  max: number
  windowSec: number
  /**
   * Định danh để đếm (mặc định: IP client). Trả về undefined để bỏ qua giới hạn này.
   * Middleware nên đặt SAU `validate` để `req.body` đã được chuẩn hóa.
   */
  key?: (req: Request) => string | undefined
  /**
   * Chỉ tính các request thất bại (status >= 400): request thành công được hoàn lượt khi phản hồi xong.
   * Dùng cho đăng nhập — chặn dò mật khẩu mà không khóa người dùng đăng nhập đúng nhiều lần.
   */
  skipSuccessfulRequests?: boolean
}

/**
 * Middleware giới hạn tần suất request (chống brute-force, spam OTP/Email, dò tài khoản)
 */
export function rateLimit(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = options.key ? options.key(req) : req.ip
    if (!identifier) {
      return next()
    }

    const key = `${options.name}:${identifier.toLowerCase()}`
    const result = await consumeRateLimit(key, options.max, options.windowSec)

    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfter))
      return next(new AppError(429, 'TOO_MANY_REQUESTS'))
    }

    if (options.skipSuccessfulRequests) {
      res.once('finish', () => {
        if (res.statusCode < 400) void refundRateLimit(key)
      })
    }

    return next()
  }
}
