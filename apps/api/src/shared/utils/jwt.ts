import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { Role } from '@repo/db'

export interface JWTPayload {
  userId: string
  role: Role
  sessionId?: string
  familyId?: string
  tokenType?: 'access' | 'refresh'
  rememberMe?: boolean
}

// Decode base64 keys
const privateKey = Buffer.from(env.JWT_PRIVATE_KEY, 'base64').toString('utf8')
const publicKey = Buffer.from(env.JWT_PUBLIC_KEY, 'base64').toString('utf8')

/**
 * Generates a JWT token for a given user payload.
 */
export function generateToken(payload: JWTPayload, expiresIn: string = env.JWT_EXPIRES_IN): string {
  return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: expiresIn as any })
}

export function generateAccessToken(payload: Omit<JWTPayload, 'tokenType'>): string {
  return generateToken({ ...payload, tokenType: 'access' }, env.JWT_EXPIRES_IN)
}

export function generateRefreshToken(payload: Omit<JWTPayload, 'tokenType'>, expiresIn: string = env.JWT_REFRESH_EXPIRES_IN): string {
  return generateToken({ ...payload, tokenType: 'refresh' }, expiresIn)
}

/**
 * Verifies a JWT token and returns the decoded payload.
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JWTPayload
}
