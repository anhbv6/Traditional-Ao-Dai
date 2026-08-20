import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../shared/middlewares/authGuard'
import { sendSuccess } from '../../shared/utils/response'
import * as userService from './user.service'

/**
 * Update user profile controller
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const updatedUser = await userService.updateUserProfile(userId, req.body)
    return sendSuccess(res, {
      statusCode: 200,
      message: 'UPDATE_PROFILE_SUCCESS',
      data: updatedUser,
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Change user password controller
 */
export async function changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    await userService.changeUserPassword(userId, req.body)
    return sendSuccess(res, {
      statusCode: 200,
      message: 'CHANGE_PASSWORD_SUCCESS',
      data: null,
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Link Google account controller
 */
export async function linkAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const { credential } = req.body
    await userService.linkGoogleAccount(userId, credential)
    return sendSuccess(res, {
      statusCode: 200,
      message: 'LINK_ACCOUNT_SUCCESS',
      data: null,
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Unlink Google account controller
 */
export async function unlinkAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const providerId = req.params.providerId || req.params.providerID
    await userService.unlinkGoogleAccount(userId, providerId)
    return sendSuccess(res, {
      statusCode: 200,
      message: 'UNLINK_ACCOUNT_SUCCESS',
      data: null,
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Get active user login sessions controller
 */
export async function getSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const currentSessionId = req.user!.sessionId
    const sessions = await userService.getUserSessions(userId, currentSessionId)
    return sendSuccess(res, {
      statusCode: 200,
      message: 'GET_SESSIONS_SUCCESS',
      data: sessions,
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * Revoke/Logout specific session controller
 */
export async function revokeSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const { sessionId } = req.params
    await userService.revokeUserSession(userId, sessionId)
    return sendSuccess(res, {
      statusCode: 200,
      message: 'REVOKE_SESSION_SUCCESS',
      data: null,
    })
  } catch (error) {
    return next(error)
  }
}
