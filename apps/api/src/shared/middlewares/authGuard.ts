import { Request, Response, NextFunction } from 'express'
import { prisma, Role } from '@repo/db'
import { AUTH_COOKIES } from '@repo/shared'
import { verifyToken, JWTPayload } from '../utils/jwt'
import { AppError } from './errorHandler'

/**
 * Extend Express Request to include decoded JWT user payload
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

/**
 * Trích xuất Access Token:
 * 1. Header `Authorization: Bearer` (khách hàng — access token giữ trong bộ nhớ FE)
 * 2. Cookie httpOnly `admin_token` (Admin/Staff) — chỉ chấp nhận vì cookie này do server đặt với SameSite=Strict,
 *    trình duyệt không gửi kèm trong request cross-site nên không bị CSRF. Không đọc bất kỳ cookie nào khác.
 */
function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    if (token) return token
  }

  const adminToken = req.cookies?.[AUTH_COOKIES.adminToken]
  if (typeof adminToken === 'string' && adminToken) {
    return adminToken
  }

  return undefined
}

/**
 * Xác thực token và trả về payload hợp lệ:
 * - Khách hàng (CUSTOMER): stateless, chỉ kiểm tra chữ ký + hạn dùng (access token sống 15 phút)
 * - Quản trị (ADMIN/STAFF): token sống tới 7 ngày nên bắt buộc gắn với UserSession còn hiệu lực,
 *   tài khoản còn hoạt động và vai trò khớp DB -> đăng xuất / khóa tài khoản có hiệu lực ngay lập tức
 */
async function resolveAccessToken(token: string): Promise<JWTPayload> {
  const decoded = verifyToken(token)

  if (decoded.tokenType && decoded.tokenType !== 'access') {
    throw new AppError(401, 'INVALID_TOKEN_TYPE')
  }

  if (decoded.role !== 'CUSTOMER') {
    if (!decoded.sessionId) {
      throw new AppError(401, 'SESSION_EXPIRED_OR_REVOKED')
    }

    const session = await prisma.userSession.findUnique({
      where: { id: decoded.sessionId },
      select: {
        userId: true,
        isRevoked: true,
        expiresAt: true,
        user: { select: { isActive: true, role: true } },
      },
    })

    if (
      !session ||
      session.userId !== decoded.userId ||
      session.isRevoked ||
      session.expiresAt <= new Date() ||
      !session.user.isActive ||
      session.user.role !== decoded.role
    ) {
      throw new AppError(401, 'SESSION_EXPIRED_OR_REVOKED')
    }
  }

  return decoded
}

/**
 * Middleware bắt buộc phải có JWT Token hợp lệ:
 * - Xác thực chữ ký và hạn sử dụng Access Token bằng RSA Public Key
 * - Phân biệt chính xác giữa lỗi hết hạn Token (401) và lỗi hệ thống (500)
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req)

  if (!token) {
    return next(new AppError(401, 'AUTHENTICATION_TOKEN_REQUIRED'))
  }

  try {
    req.user = await resolveAccessToken(token)
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
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req)
  req.user = undefined

  if (token) {
    try {
      req.user = await resolveAccessToken(token)
    } catch {
      // Token không hợp lệ, hết hạn hoặc phiên đã bị thu hồi -> tiếp tục với vai trò khách vãng lai
      req.user = undefined
    }
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
