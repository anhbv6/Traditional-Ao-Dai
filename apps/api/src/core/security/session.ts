import { createHash } from 'crypto'
import { prisma, type SessionKind } from '@repo/db'
import { ADMIN_SESSION_IDLE_TIMEOUT_MS, SESSION_TOUCH_INTERVAL_MS } from '@repo/shared'

/**
 * Băm token (refresh token) bằng SHA-256 trước khi lưu DB — DB bị lộ cũng không dùng lại được token
 */
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Dọn các phiên đã hết hạn hoặc đã bị thu hồi của một người dùng (gọi mỗi khi tạo phiên mới để bảng không phình mãi).
 * Phiên của người không bao giờ đăng nhập lại cần job dọn định kỳ theo index `expiresAt`.
 */
export async function cleanupUserSessions(userId: string) {
  await prisma.userSession.deleteMany({
    where: {
      userId,
      OR: [{ expiresAt: { lte: new Date() } }, { revokedAt: { not: null } }],
    },
  })
}

/**
 * Thu hồi (xóa) toàn bộ phiên đăng nhập của người dùng ở mọi khu vực, có thể giữ lại phiên hiện tại
 */
export async function revokeAllUserSessions(userId: string, exceptSessionId?: string) {
  await prisma.userSession.deleteMany({
    where: {
      userId,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
  })
}

interface SessionState {
  kind: SessionKind
  expiresAt: Date
  revokedAt: Date | null
  lastUsedAt: Date
}

/**
 * Phiên còn dùng được không: chưa thu hồi, chưa hết hạn tối đa, và (phiên ADMIN) chưa quá thời gian nhàn rỗi
 */
export function isSessionUsable(session: SessionState, now = new Date()): boolean {
  if (session.revokedAt || session.expiresAt <= now) return false
  if (session.kind === 'ADMIN' && now.getTime() - session.lastUsedAt.getTime() > ADMIN_SESSION_IDLE_TIMEOUT_MS) {
    return false
  }
  return true
}

/**
 * Ghi lại thời điểm dùng phiên gần nhất — chỉ UPDATE khi giá trị cũ hơn SESSION_TOUCH_INTERVAL_MS
 */
export async function touchSession(sessionId: string, lastUsedAt: Date, now = new Date()) {
  if (now.getTime() - lastUsedAt.getTime() < SESSION_TOUCH_INTERVAL_MS) return
  await prisma.userSession.update({ where: { id: sessionId }, data: { lastUsedAt: now } })
}
