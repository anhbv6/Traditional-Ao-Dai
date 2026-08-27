import { Request, Response, NextFunction } from 'express'
import { prisma, Role } from '@repo/db'
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
 * Middleware bắt buộc phải có JWT Token hợp lệ (Dành cho Profile, Đổi mật khẩu, Admin...)
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req)

  if (!token) {
    return next(new AppError(401, 'Authentication token required'))
  }

  try {
    const decoded = verifyToken(token)
    if (decoded.tokenType && decoded.tokenType !== 'access') {
      return next(new AppError(401, 'Invalid authentication token type'))
    }

    if (decoded.sessionId) {
      const session = await prisma.userSession.findFirst({
        where: {
          id: decoded.sessionId,
          userId: decoded.userId,
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      })

      if (!session) {
        return next(new AppError(401, 'Session expired or revoked'))
      }
    }

    req.user = decoded
    return next()
  } catch (error) {
    return next(new AppError(401, 'Invalid or expired authentication token'))
  }
}

/**
 * Middleware xác thực tùy chọn (Optional Auth):
 * - Nếu có token hợp lệ -> gán req.user (Khách đã đăng nhập)
 * - Nếu không có token hoặc token không hợp lệ -> cho qua với req.user = undefined (Khách vãng lai)
 * Dùng cho các endpoint: Xem sản phẩm, Giỏ hàng, Áp mã voucher, Đặt hàng không cần login...
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req)

  if (!token) {
    req.user = undefined
    return next()
  }

  try {
    const decoded = verifyToken(token)
    if (decoded.tokenType === 'access') {
      if (decoded.sessionId) {
        const session = await prisma.userSession.findFirst({
          where: {
            id: decoded.sessionId,
            userId: decoded.userId,
            isRevoked: false,
            expiresAt: {
              gt: new Date(),
            },
          },
        })
        if (session) {
          req.user = decoded
        }
      } else {
        req.user = decoded
      }
    }
  } catch {
    // Không ném lỗi 401, tiếp tục xử lý với vai trò khách vãng lai
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
      return next(new AppError(401, 'Authentication required'))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Access denied: insufficient permissions'))
    }

    return next()
  }
}
