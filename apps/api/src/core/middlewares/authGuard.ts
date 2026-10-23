import { type Request, type Response, type NextFunction } from 'express'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { prisma, type Role } from '@repo/db'
import { AUTH_COOKIES, isAdminAreaRole } from '@repo/shared'
import { verifyToken, type JWTPayload } from '../security/jwt'
import { isSessionUsable, touchSession } from '../security/session'
import { AppError } from '../http/AppError'

/**
 * Extend Express Request to include decoded JWT user payload
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

/** Access token storefront: chỉ đọc từ header Bearer (token giữ trong bộ nhớ FE) */
function extractBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1] || undefined
  }
  return undefined
}

/**
 * Token khu quản trị: chỉ đọc cookie httpOnly `admin_token`. Cookie này do server đặt với SameSite=Strict nên
 * trình duyệt không gửi kèm trong request cross-site (không bị CSRF). Không đọc bất kỳ cookie nào khác.
 */
function extractAdminCookie(req: Request): string | undefined {
  const adminToken = req.cookies?.[AUTH_COOKIES.adminToken]
  return typeof adminToken === 'string' && adminToken ? adminToken : undefined
}

/**
 * Token storefront: stateless — chỉ kiểm tra chữ ký, hạn dùng (15 phút) và audience. Khóa tài khoản có hiệu lực
 * chậm nhất khi access token hết hạn (refresh sẽ bị từ chối).
 */
function resolveStoreToken(token: string): JWTPayload {
  const decoded = verifyToken(token, 'store')
  if (decoded.tokenType !== 'access') {
    throw new AppError(401, 'INVALID_TOKEN_TYPE')
  }
  return decoded
}

/**
 * Token quản trị: sống tới 7 ngày nên bắt buộc gắn với UserSession ADMIN còn hiệu lực (kể cả thời gian nhàn rỗi),
 * tài khoản còn hoạt động và vai trò khớp DB -> đăng xuất / khóa tài khoản có hiệu lực ngay lập tức.
 */
async function resolveAdminToken(token: string): Promise<JWTPayload> {
  const decoded = verifyToken(token, 'admin')
  if (decoded.tokenType !== 'access') {
    throw new AppError(401, 'INVALID_TOKEN_TYPE')
  }

  const session = await prisma.userSession.findUnique({
    where: { id: decoded.sessionId },
    select: {
      userId: true,
      kind: true,
      expiresAt: true,
      revokedAt: true,
      lastUsedAt: true,
      user: { select: { status: true, role: true } },
    },
  })

  if (
    !session ||
    session.kind !== 'ADMIN' ||
    session.userId !== decoded.userId ||
    !isSessionUsable(session) ||
    session.user.status !== 'ACTIVE' ||
    !isAdminAreaRole(session.user.role)
  ) {
    throw new AppError(401, 'SESSION_EXPIRED_OR_REVOKED')
  }

  await touchSession(decoded.sessionId, session.lastUsedAt)
  // Vai trò lấy từ DB (có thể đã bị hạ quyền sau khi cấp token)
  return { ...decoded, role: session.user.role }
}

function toAuthError(error: unknown): unknown {
  // TokenExpiredError kế thừa JsonWebTokenError -> kiểm tra hết hạn trước
  if (error instanceof TokenExpiredError) return new AppError(401, 'TOKEN_EXPIRED')
  if (error instanceof JsonWebTokenError) return new AppError(401, 'INVALID_TOKEN')
  return error
}

/**
 * Bắt buộc access token STOREFRONT (Bearer). Dùng cho mọi endpoint của khách hàng (hồ sơ, địa chỉ, đơn của tôi...).
 * STAFF/ADMIN mua hàng cũng đi qua đây bằng phiên storefront của họ.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req)
  if (!token) {
    return next(new AppError(401, 'AUTHENTICATION_TOKEN_REQUIRED'))
  }

  try {
    req.user = resolveStoreToken(token)
    return next()
  } catch (error) {
    return next(toAuthError(error))
  }
}

/**
 * Chấp nhận phiên của bất kỳ khu nào: Bearer storefront, nếu không có thì cookie quản trị.
 * Chỉ dùng cho endpoint phục vụ cả hai khu (vd. upload ảnh).
 */
export async function requireAnyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const bearer = extractBearerToken(req)
  const adminCookie = bearer ? undefined : extractAdminCookie(req)
  if (!bearer && !adminCookie) {
    return next(new AppError(401, 'AUTHENTICATION_TOKEN_REQUIRED'))
  }

  try {
    req.user = bearer ? resolveStoreToken(bearer) : await resolveAdminToken(adminCookie!)
    return next()
  } catch (error) {
    return next(toAuthError(error))
  }
}

/**
 * Xác thực tùy chọn (storefront):
 * - Có token hợp lệ -> gán req.user (khách đã đăng nhập)
 * - Không có / không hợp lệ -> req.user = undefined (khách vãng lai)
 * Dùng cho endpoint công khai nhưng cá nhân hóa được: xem sản phẩm, giỏ hàng, áp voucher, đặt hàng...
 */
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req)
  req.user = undefined

  if (token) {
    try {
      req.user = resolveStoreToken(token)
    } catch {
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
