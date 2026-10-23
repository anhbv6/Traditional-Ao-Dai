import { type Request, type Response, type NextFunction } from 'express'
import { AUTH_COOKIES } from '@repo/shared'
import * as authService from './auth.service'
import { sendSuccess } from '../../../core/http/response'
import { clearAdminSessionCookies, setAdminSessionCookies } from '../../../core/security/authCookies'

/**
 * Đăng nhập khu quản trị. Token được đặt vào cookie httpOnly `admin_token` (SameSite=Strict);
 * thông tin người dùng do Next.js đọc lại từ DB (getAdminSessionAction), body không trả gì thêm.
 */
export async function loginAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.adminLogin(req.body, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    })

    setAdminSessionCookies(res, result.token, result.role, result.rememberMe, result.expiresAt)

    return sendSuccess(res, {
      data: { role: result.role },
      message: 'ADMIN_LOGIN_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Đăng xuất khu quản trị (luôn xóa cookie, kể cả khi phiên đã hết hạn / bị thu hồi)
 */
export async function logoutAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.adminLogout(req.cookies?.[AUTH_COOKIES.adminToken])
    clearAdminSessionCookies(res)
    return sendSuccess(res, {
      data: null,
      message: 'ADMIN_LOGOUT_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}
