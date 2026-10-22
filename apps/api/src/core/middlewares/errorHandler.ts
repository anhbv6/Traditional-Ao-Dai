import { type Request, type Response, type NextFunction } from 'express'
import { Prisma } from '@repo/db'
import { ZodError } from 'zod'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { sendError } from '../http/response'

/**
 * Middleware xử lý lỗi tập trung toàn hệ thống (Global Error Handler)
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // Express nhận diện error handler qua đủ 4 tham số — giữ `_next` dù không dùng
  _next: NextFunction
): void {
  // Thuộc tính chung của AppError / Error / MulterError (cùng có `code`)
  const info = (err ?? {}) as { statusCode?: number; message?: string; name?: string; code?: string; stack?: string }
  let statusCode = info.statusCode || 500
  let message = info.message || 'Internal Server Error'

  // 1. Bắt lỗi Validation của Zod
  if (err instanceof ZodError) {
    statusCode = 400
    message = 'VALIDATION_ERROR'
    res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'VALIDATION_ERROR',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    })
    return
  }

  // 2. Bắt các mã lỗi phổ biến của Prisma ORM
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation (ví dụ: trùng email, số điện thoại, SKU)
        statusCode = 409
        const target = (err.meta?.target as string[]) || []
        message = target.length > 0 ? `DUPLICATE_${target.join('_').toUpperCase()}` : 'DUPLICATE_KEY_ERROR'
        break
      }
      case 'P2025': {
        // Record not found
        statusCode = 404
        message = 'RECORD_NOT_FOUND'
        break
      }
      case 'P2003': {
        // Foreign key constraint failed
        statusCode = 400
        message = 'FOREIGN_KEY_CONSTRAINT_FAILED'
        break
      }
      default: {
        statusCode = 400
        message = `DATABASE_ERROR_${err.code}`
        break
      }
    }
  }

  // 3. Bắt lỗi JWT Token
  if (err instanceof TokenExpiredError) {
    statusCode = 401
    message = 'TOKEN_EXPIRED'
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401
    message = 'INVALID_TOKEN'
  }

  // 4. Bắt lỗi Upload File của Multer
  if (info.name === 'MulterError') {
    statusCode = 400
    if (info.code === 'LIMIT_FILE_SIZE') {
      message = 'FILE_TOO_LARGE'
    } else {
      message = `UPLOAD_ERROR_${info.code}`
    }
  }

  // Log lỗi chi tiết trong môi trường development hoặc khi gặp lỗi server 500
  if (process.env.NODE_ENV === 'development' || statusCode >= 500) {
    console.error(`[API Error] ${statusCode} - ${req.method} ${req.originalUrl || req.url}:`, err)
  }

  sendError(res, {
    message,
    statusCode,
    stack: info.stack,
  })
}
