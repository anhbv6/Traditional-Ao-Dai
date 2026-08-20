import { Request, Response, NextFunction } from 'express'
import { prisma, Role } from '@repo/db'
import { verifyToken, JWTPayload } from '../utils/jwt'
import { AppError } from './errorHandler'

/**
 * Extend Express Request to include decoded JWT user payload
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

/**
 * Middleware to require a valid JWT bearer token.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication token required'))
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return next(new AppError(401, 'Authentication token is empty'))
  }

  try {
    const decoded = verifyToken(token)
    if (decoded.tokenType && decoded.tokenType !== 'access') {
      return next(new AppError(401, 'Invalid authentication token type'))
    }

    if (decoded.sessionId) {
      const session = await prisma.userSession.findFirst({
        where: {
          id: decoded.sessionId,
          userId: decoded.userId,
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      })

      if (!session) {
        return next(new AppError(401, 'Session expired or revoked'))
      }
    }

    req.user = decoded
    return next()
  } catch (error) {
    return next(new AppError(401, 'Invalid or expired authentication token'))
  }
}

/**
 * Middleware to enforce role-based access control.
 */
export function requireRoles(roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Access denied: insufficient permissions'))
    }

    return next()
  }
}
