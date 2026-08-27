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

/**
 * Hàm giải mã và chuẩn hóa khóa RSA PEM từ chuỗi môi trường:
 * - Hỗ trợ cả chuỗi Base64 hoặc chuỗi PEM trực tiếp
 * - Tự động thay thế chuỗi ký tự "\n" thành ký tự xuống dòng thật '\n'
 */
function parseJwtKey(rawKey: string): string {
  let key = rawKey.trim()

  // Nếu chuỗi không chứa header PEM, thử decode từ Base64
  if (!key.includes('-----BEGIN')) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf8')
      if (decoded.includes('-----BEGIN')) {
        key = decoded
      }
    } catch {
      // Giữ nguyên chuỗi gốc nếu decode thất bại
    }
  }

  // Chuyển đổi ký tự escape \n thành xuống dòng thực tế
  return key.replace(/\\n/g, '\n')
}

// Khởi tạo cặp khóa RSA đã được làm sạch
const privateKey = parseJwtKey(env.JWT_PRIVATE_KEY)
const publicKey = parseJwtKey(env.JWT_PUBLIC_KEY)

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
