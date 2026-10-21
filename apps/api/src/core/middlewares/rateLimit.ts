import { Request, Response, NextFunction } from 'express'
import { AppError } from '../http/AppError'
import { consumeRateLimit, refundRateLimit } from '../security/rateLimit'

export interface RateLimitOptions {
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
