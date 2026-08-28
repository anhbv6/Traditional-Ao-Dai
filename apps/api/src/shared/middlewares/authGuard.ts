import { Request, Response, NextFunction } from 'express'
import { Role } from '@repo/db'
import { verifyToken, JWTPayload } from '../utils/jwt'
import { AppError } from './errorHandler'

/**
 * Extend Express Request to include decoded JWT user payload
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

/**
 * Helper trích xuất Access Token từ Header Authorization hoặc Cookie
 */
function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    if (token) return token
  }

  // Fallback đọc từ Cookie (nếu có)
  if (req.cookies) {
    if (typeof req.cookies.accessToken === 'string' && req.cookies.accessToken) {
      return req.cookies.accessToken
    }
    if (typeof req.cookies.admin_token === 'string' && req.cookies.admin_token) {
      return req.cookies.admin_token
    }
  }

  return undefined
}

/**
 * Middleware bắt buộc phải có JWT Token hợp lệ (Stateless, 0ms DB Overhead):
 * - Xác thực chữ ký và hạn sử dụng Access Token tức thì trong RAM bằng RSA Public Key
 * - Phân biệt chính xác giữa lỗi hết hạn Token (401) và lỗi hệ thống (500)
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req)

  if (!token) {
    return next(new AppError(401, 'AUTHENTICATION_TOKEN_REQUIRED'))
  }

  try {
    const decoded = verifyToken(token)

    if (decoded.tokenType && decoded.tokenType !== 'access') {
      return next(new AppError(401, 'INVALID_TOKEN_TYPE'))
    }

    req.user = decoded
    return next()
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError(401, 'TOKEN_EXPIRED'))
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError(401, 'INVALID_TOKEN'))
    }
    return next(error)
  }
}

/**
 * Middleware xác thực tùy chọn (Optional Auth):
 * - Nếu có token hợp lệ -> gán req.user (Khách đã đăng nhập)
 * - Nếu không có token hoặc token không hợp lệ -> cho qua với req.user = undefined (Khách vãng lai)
 * Dùng cho các endpoint công khai nhưng có thể cá nhân hóa: Xem sản phẩm, Giỏ hàng, Áp mã voucher, Đặt hàng...
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req)

  if (!token) {
    req.user = undefined
    return next()
  }

  try {
    const decoded = verifyToken(token)
    if (decoded.tokenType === 'access') {
      req.user = decoded
    } else {
      req.user = undefined
    }
  } catch {
    // Token không hợp lệ hoặc hết hạn -> tiếp tục với vai trò khách vãng lai
    req.user = undefined
  }

  return next()
}

/**
 * Middleware kiểm tra quyền theo Role (ADMIN, STAFF, CUSTOMER)
 */
export function requireRoles(roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'AUTHENTICATION_REQUIRED'))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'INSUFFICIENT_PERMISSIONS'))
    }

    return next()
  }
}
