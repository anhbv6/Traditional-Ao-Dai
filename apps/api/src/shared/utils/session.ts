import { createHash } from 'crypto'
import { prisma } from '@repo/db'

/**
 * Băm token (refresh token, session secret) bằng SHA-256 trước khi lưu DB — DB bị lộ cũng không dùng lại được token
 */
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Dọn các phiên đã hết hạn hoặc đã bị thu hồi của một người dùng (gọi mỗi khi tạo phiên mới để bảng không phình mãi)
 */
export async function cleanupUserSessions(userId: string) {
  await prisma.userSession.deleteMany({
    where: {
      userId,
      OR: [{ expiresAt: { lte: new Date() } }, { isRevoked: true }],
    },
  })
}

/**
 * Thu hồi toàn bộ phiên đăng nhập của người dùng, có thể giữ lại phiên hiện tại
 */
export async function revokeAllUserSessions(userId: string, exceptSessionId?: string) {
  await prisma.userSession.deleteMany({
    where: {
      userId,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
  })
}
