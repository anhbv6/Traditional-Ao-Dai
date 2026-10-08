import { Request, Response, NextFunction } from 'express'
import { AUTH_COOKIES } from '@repo/shared'
import * as authService from './auth.service'
import { sendSuccess } from '../../../shared/utils/response'
import { clearAdminSessionCookies, setAdminSessionCookies } from '../../../shared/utils/authCookies'

/**
 * Controller handler for Admin and Staff Login.
 * Token được đặt vào cookie httpOnly `admin_token` (SameSite=Strict); body chỉ trả thông tin người dùng.
 */
export async function loginAdmin(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await authService.adminLogin(req.body, {
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip,
    })

    setAdminSessionCookies(res, result.token, result.user.role, result.rememberMe, result.expiresAt)

    return sendSuccess(res, {
      data: { user: result.user },
      message: 'ADMIN_LOGIN_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Controller handler for Admin and Staff Logout (luôn xóa cookie, kể cả khi phiên đã hết hạn / bị thu hồi)
 */
export async function logoutAdmin(req: Request, res: Response, next: NextFunction): Promise<any> {
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
