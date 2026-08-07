import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { Role } from '@repo/db'

export interface JWTPayload {
  userId: string
  email: string
  role: Role
}

/**
 * Generates a JWT token for a given user payload.
 */
export function generateToken(payload: JWTPayload, expiresIn: string = '1d'): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn })
}

/**
 * Verifies a JWT token and returns the decoded payload.
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload
}
