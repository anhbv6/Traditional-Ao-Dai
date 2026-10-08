import { Request, Response, NextFunction } from 'express'

/**
 * Ghi log mỗi request: method, đường dẫn, status, thời gian xử lý, IP.
 * Không log body/headers để tránh lộ mật khẩu, token, OTP.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    const line = `[HTTP] ${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${durationMs.toFixed(1)}ms ip=${req.ip}`

    if (res.statusCode >= 500) {
      console.error(line)
    } else if (res.statusCode >= 400) {
      console.warn(line)
    } else {
      console.log(line)
    }
  })

  next()
}
