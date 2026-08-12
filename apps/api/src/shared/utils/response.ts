import { Response } from 'express'

/**
 * Standard API Response structure
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  statusCode: number
  message?: string
  data?: T
  meta?: {
    page?: number
    limit?: number
    totalItems?: number
    totalPages?: number
    [key: string]: any
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
): Response {
  const { data, message, statusCode = 200, meta } = options

  const responseBody: ApiResponse<T> = {
    status: 'success',
    statusCode,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  }

  return res.status(statusCode).json(responseBody)
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
): Response {
  const { message, statusCode = 500, stack } = options

  const responseBody: ApiResponse = {
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && stack && { stack }),
  }

  return res.status(statusCode).json(responseBody)
}
