import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import * as userService from '../../user/user.service'
import { AuthenticatedRequest } from '../../../shared/middlewares/authGuard'
import { sendSuccess, sendError } from '../../../shared/utils/response'

/**
 * Controller handler for Admin Login
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
 * Controller handler to fetch logged in user profile (me)
 */
export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return sendError(res, {
        statusCode: 401,
        message: 'UNAUTHORIZED',
      })
    }

    const user = await userService.getUserById(userId)
    return sendSuccess(res, {
      data: user,
      message: 'GET_PROFILE_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}
