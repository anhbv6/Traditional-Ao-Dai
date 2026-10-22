import { type Response } from 'express'

/**
 * Standard API Response structure
 */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error'
  statusCode: number
  message?: string
  data?: T
  meta?: {
    page?: number
    limit?: number
    totalItems?: number
    totalPages?: number
    [key: string]: unknown
  }
  stack?: string
}

/**
 * Send a unified success response to the client
 */
export function sendSuccess<T>(
  res: Response,
  options: {
    data?: T
    message?: string
    statusCode?: number
    meta?: ApiResponse['meta']
  }
): void {
  const { data, message, statusCode = 200, meta } = options

  const responseBody: ApiResponse<T> = {
    status: 'success',
    statusCode,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  }

  res.status(statusCode).json(responseBody)
}

/**
 * Send a unified error response to the client
 */
export function sendError(
  res: Response,
  options: {
    message: string
    statusCode?: number
    stack?: string
  }
): void {
  const { message, statusCode = 500, stack } = options

  const responseBody: ApiResponse = {
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && stack && { stack }),
  }

  res.status(statusCode).json(responseBody)
}
