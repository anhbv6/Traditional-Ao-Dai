import { Request, Response, NextFunction } from 'express'

/**
 * Custom Operational Error Class
 */
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Express Global Error Handling Middleware
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  // Log error stack in development, or if it's a 500 error
  if (process.env.NODE_ENV === 'development' || statusCode === 500) {
    console.error(`[Error] ${statusCode} - ${req.method} ${req.url}:`, err)
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
