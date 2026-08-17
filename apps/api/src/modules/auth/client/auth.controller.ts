import { CookieOptions, Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import * as userService from '../../user/user.service'
import { AuthenticatedRequest } from '../../../shared/middlewares/authGuard'
import { sendSuccess, sendError } from '../../../shared/utils/response'
import { secondsUntil } from '../../../shared/utils/number'

const REFRESH_TOKEN_COOKIE = 'refreshToken'

/**
 * Controller handler for Client Registration
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<any> {
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
 * Controller handler for Client Login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await authService.clientLogin(req.body, {
      deviceInfo: req.headers['user-agent'],
      ipAddress: getClientIp(req),
    })
    setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt)
    return sendSuccess(res, {
      data: {
        accessToken: result.accessToken,
      },
      message: 'LOGIN_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Controller handler for refreshing client access token.
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const refreshToken = getCookie(req, REFRESH_TOKEN_COOKIE)
    if (!refreshToken) {
      clearRefreshTokenCookie(res)
      return sendError(res, {
        statusCode: 401,
        message: 'REFRESH_TOKEN_MISSING',
      })
    }

    const result = await authService.refreshClientToken({ refreshToken })
    setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt)
    return sendSuccess(res, {
      data: {
        accessToken: result.accessToken,
      },
      message: 'REFRESH_TOKEN_SUCCESS',
    })
  } catch (error) {
    clearRefreshTokenCookie(res)
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

/**
 * Controller handler for revoking the current client session.
 */
export async function logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const refreshToken = getCookie(req, REFRESH_TOKEN_COOKIE)
    if (refreshToken) {
      await authService.logoutClientByRefreshToken(refreshToken)
    }

    clearRefreshTokenCookie(res)
    return sendSuccess(res, {
      data: null,
      message: 'LOGOUT_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}

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

function getCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) {
    return undefined
  }

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim())
  const prefix = `${name}=`
  const rawCookie = cookies.find((cookie) => cookie.startsWith(prefix))
  if (!rawCookie) {
    return undefined
  }

  return decodeURIComponent(rawCookie.slice(prefix.length))
}

function refreshCookieOptions(expiresAt: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: secondsUntil(expiresAt) * 1000,
  }
}

function setRefreshTokenCookie(res: Response, refreshToken: string, expiresAt: Date) {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions(expiresAt))
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
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


/**
 * Controller handler to update logged in user profile
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return sendError(res, {
        statusCode: 401,
        message: 'UNAUTHORIZED',
      })
    }

    const updatedUser = await authService.updateUserProfile(userId, req.body)
    return sendSuccess(res, {
      data: updatedUser,
      message: 'UPDATE_PROFILE_SUCCESS',
    })
  } catch (error) {
    return next(error)
  }
}


