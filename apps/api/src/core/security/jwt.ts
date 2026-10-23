import jwt, { type SignOptions } from 'jsonwebtoken'
import { type AuthTokenClaims, type TokenAudience } from '@repo/shared'
import { env } from '../../config/env'

/** Claim do server ký (iat/exp do thư viện tự thêm) */
export type JWTPayload = AuthTokenClaims

type SignableClaims = Omit<AuthTokenClaims, 'tokenType' | 'aud' | 'iat' | 'exp'>

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

function signToken(claims: Omit<AuthTokenClaims, 'aud' | 'iat' | 'exp'>, audience: TokenAudience, expiresIn: string): string {
  return jwt.sign(claims, privateKey, {
    algorithm: 'RS256',
    audience,
    expiresIn: expiresIn as SignOptions['expiresIn'],
  })
}

/**
 * Access token. `audience` ghi rõ token được cấp cho khu nào: token storefront không dùng được ở khu quản trị
 * và ngược lại, kể cả khi người dùng là STAFF/ADMIN.
 */
export function generateAccessToken(claims: SignableClaims, audience: TokenAudience, expiresIn: string = env.JWT_EXPIRES_IN): string {
  return signToken({ ...claims, tokenType: 'access' }, audience, expiresIn)
}

/** Refresh token — chỉ có ở storefront (khu quản trị dùng phiên cookie, không refresh) */
export function generateRefreshToken(claims: SignableClaims, expiresIn: string): string {
  return signToken({ ...claims, tokenType: 'refresh' }, 'store', expiresIn)
}

/**
 * Xác minh chữ ký, hạn dùng và audience của JWT. Ném lỗi của jsonwebtoken nếu không hợp lệ.
 */
export function verifyToken(token: string, audience: TokenAudience): JWTPayload {
  const decoded: string | jwt.JwtPayload = jwt.verify(token, publicKey, { algorithms: ['RS256'], audience })
  if (typeof decoded === 'string' || typeof decoded.userId !== 'string' || typeof decoded.sessionId !== 'string') {
    throw new jwt.JsonWebTokenError('invalid payload')
  }
  return decoded as unknown as JWTPayload
}
