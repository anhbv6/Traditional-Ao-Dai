import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import { AuthenticatedRequest } from '../../../shared/middlewares/authGuard'
import { sendSuccess } from '../../../shared/utils/response'

/**
 * Controller handler for Admin and Staff Login
 */
export async function loginAdmin(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await authService.adminLogin(req.body)
    return sendSuccess(res, {
      data: result,
      message: 'ADMIN_LOGIN_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Controller handler for Admin and Staff Logout
 */
export async function logoutAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const userId = req.user?.userId
    await authService.adminLogout(userId)
    return sendSuccess(res, {
      data: null,
      message: 'ADMIN_LOGOUT_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}
