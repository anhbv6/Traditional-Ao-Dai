import { createPublicKey, verify, type KeyObject } from 'node:crypto';

/**
 * Payload JWT do Backend (@repo/api) ký bằng RS256 — giữ khớp với `apps/api/src/shared/utils/jwt.ts`
 */
export interface AdminJwtPayload {
  userId: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  sessionId?: string;
  tokenType?: 'access' | 'refresh';
  rememberMe?: boolean;
  exp?: number;
  iat?: number;
}

let cachedPublicKey: KeyObject | null | undefined;

/**
 * Nạp RSA Public Key từ biến môi trường JWT_PUBLIC_KEY (chấp nhận PEM trực tiếp hoặc Base64 của PEM)
 */
function getPublicKey(): KeyObject | null {
  if (cachedPublicKey !== undefined) return cachedPublicKey;

  const rawKey = process.env.JWT_PUBLIC_KEY?.trim();
  if (!rawKey) {
    console.error('[jwt.server] Thiếu biến môi trường JWT_PUBLIC_KEY — mọi token quản trị sẽ bị từ chối.');
    cachedPublicKey = null;
    return null;
  }

  let pem = rawKey;
  if (!pem.includes('-----BEGIN')) {
    const decoded = Buffer.from(pem, 'base64').toString('utf8');
    if (decoded.includes('-----BEGIN')) pem = decoded;
  }
  pem = pem.replace(/\\n/g, '\n');

  try {
    cachedPublicKey = createPublicKey(pem);
  } catch (error) {
    console.error('[jwt.server] JWT_PUBLIC_KEY không hợp lệ:', error);
    cachedPublicKey = null;
  }
  return cachedPublicKey;
}

/**
 * Xác minh chữ ký RS256 và hạn sử dụng của JWT. Trả về payload nếu hợp lệ, ngược lại trả về null.
 * Chỉ dùng phía server (Proxy, Server Components, Server Actions).
 */
export function verifyAccessToken(token: string | undefined | null): AdminJwtPayload | null {
  if (!token) return null;

  const publicKey = getPublicKey();
  if (!publicKey) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
    if (header?.alg !== 'RS256') return null;

    const isValidSignature = verify(
      'RSA-SHA256',
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      publicKey,
      Buffer.from(encodedSignature, 'base64url')
    );
    if (!isValidSignature) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as AdminJwtPayload;

    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return null;
    if (payload.tokenType && payload.tokenType !== 'access') return null;
    if (!payload.userId || !payload.role) return null;

    return payload;
  } catch {
    return null;
  }
}
