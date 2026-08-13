import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import { AuthenticatedRequest } from '../../../shared/middlewares/authGuard'
import { sendSuccess, sendError } from '../../../shared/utils/response'
import { AppError } from '../../../shared/middlewares/errorHandler'

function getClientIp(req: Request): string | undefined {
  const forwardedFor = req.headers['x-forwarded-for']
  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0]
  }

  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim()
  }

  return req.ip
}

/**
 * Controller handler for Client Login
 */
export async function loginClient(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await authService.clientLogin(req.body, {
      deviceInfo: req.headers['user-agent'],
      ipAddress: getClientIp(req),
    })
    return sendSuccess(res, {
      data: result,
      message: 'LOGIN_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Controller handler for refreshing client access token.
 */
export async function refreshClientToken(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await authService.refreshClientToken(req.body)
    return sendSuccess(res, {
      data: result,
      message: 'REFRESH_TOKEN_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Controller handler for revoking the current client session.
 */
export async function logoutClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return sendError(res, {
        statusCode: 401,
        message: 'UNAUTHORIZED',
      })
    }

    await authService.logoutClient(userId, req.user?.sessionId, req.body?.refreshToken)
    return sendSuccess(res, {
      data: null,
      message: 'LOGOUT_SUCCESS',
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
    await authService.clientRegister(req.body)
    return sendSuccess(res, {
      data: null,
      message: 'REGISTER_SUCCESS',
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
        message: 'UNAUTHORIZED',
      })
    }

    const user = await authService.getUserById(userId)
    return sendSuccess(res, {
      data: user,
      message: 'GET_PROFILE_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Controller handler to check duplicate email and phone number in real-time
 */
export async function checkAccount(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { email, phone } = req.query as { email?: string; phone?: string }
    const result = await authService.checkAccountAvailability(email, phone)
    return sendSuccess(res, {
      data: result,
      message: 'CHECK_ACCOUNT_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}


