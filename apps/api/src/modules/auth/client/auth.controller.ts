import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import { AuthenticatedRequest } from '../../../shared/middlewares/authGuard'
import { sendSuccess, sendError } from '../../../shared/utils/response'

/**
 * Controller handler for Client Login
 */
export async function loginClient(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await authService.clientLogin(req.body)
    return sendSuccess(res, {
      data: result,
      message: 'Đăng nhập thành công',
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Controller handler for Client Registration
 */
export async function registerClient(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await authService.clientRegister(req.body)
    return sendSuccess(res, {
      data: result,
      message: 'Đăng ký tài khoản thành công',
      statusCode: 201,
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
        message: 'Không tìm thấy thông tin định danh người dùng',
      })
    }

    const user = await authService.getUserById(userId)
    return sendSuccess(res, {
      data: user,
    })
  } catch (error) {
    return next(error)
  }
}
