import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import { AuthenticatedRequest } from '../../../shared/middlewares/authGuard'

/**
 * Controller handler for Client Login
 */
export async function loginClient(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await authService.clientLogin(req.body)
    return res.status(200).json({
      status: 'success',
      message: 'Đăng nhập thành công',
      data: result,
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
    return res.status(201).json({
      status: 'success',
      message: 'Đăng ký tài khoản thành công',
      data: result,
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
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Không tìm thấy thông tin định danh người dùng',
      })
    }

    const user = await authService.getUserById(userId)
    return res.status(200).json({
      status: 'success',
      data: user,
    })
  } catch (error) {
    return next(error)
  }
}
