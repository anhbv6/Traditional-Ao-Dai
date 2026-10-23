import { prisma } from '@repo/db'
import { randomUUID } from 'crypto'
import { isAdminAreaRole, normalizeEmail } from '@repo/shared'
import { comparePassword } from '../../../core/security/password'
import { generateAccessToken, verifyToken } from '../../../core/security/jwt'
import { AppError } from '../../../core/http/AppError'
import { durationToMs } from '../../../core/utils/time'
import { cleanupUserSessions } from '../../../core/security/session'
import { type AdminLoginInput } from '../auth.schema'
import { type SessionMeta } from '../auth.types'

/**
 * Đăng nhập khu quản trị (chỉ STAFF / ADMIN). Khu quản trị CHỈ có đăng nhập — tài khoản nhân viên do ADMIN tạo,
 * quên mật khẩu thì dùng luồng của storefront (cùng tài khoản) hoặc nhờ ADMIN đặt lại.
 * - Mỗi lần đăng nhập tạo một UserSession ADMIN; token mang sessionId để thu hồi được (đăng xuất, khóa tài khoản)
 * - Không phân biệt "sai tài khoản", "sai mật khẩu" hay "không phải nhân viên" để tránh dò email quản trị
 */
export async function adminLogin(input: AdminLoginInput['body'], meta: SessionMeta = {}) {
  const email = normalizeEmail(input.email)
  const { password, rememberMe } = input

  const user = await prisma.user.findUnique({ where: { email } })

  const isPasswordMatch =
    !!user && isAdminAreaRole(user.role) && !!user.passwordHash && (await comparePassword(password, user.passwordHash))

  if (!user || !isPasswordMatch || user.status === 'DELETED') {
    throw new AppError(401, 'INVALID_CREDENTIALS')
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }

  // Hạn tối đa: 7 ngày khi ghi nhớ, 1 ngày nếu không. Ngoài ra phiên hết hạn khi nhàn rỗi quá lâu (xem session.ts)
  const tokenExpiresIn = rememberMe ? '7d' : '1d'
  const expiresAt = new Date(Date.now() + durationToMs(tokenExpiresIn))
  const sessionId = randomUUID()

  await cleanupUserSessions(user.id)

  await prisma.$transaction([
    prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        kind: 'ADMIN',
        familyId: sessionId,
        rememberMe: Boolean(rememberMe),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    }),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ])

  const token = generateAccessToken(
    { userId: user.id, role: user.role, sessionId, rememberMe: Boolean(rememberMe) },
    'admin',
    tokenExpiresIn
  )

  // Token chỉ được đặt vào cookie httpOnly ở controller, không trả về body cho JavaScript đọc
  return {
    token,
    expiresAt,
    rememberMe: Boolean(rememberMe),
    role: user.role,
  }
}

/**
 * Đăng xuất khu quản trị: xóa đúng phiên của token (nếu token còn hợp lệ).
 * Không ném lỗi khi token hỏng/hết hạn — controller vẫn luôn xóa cookie.
 */
export async function adminLogout(token?: string) {
  if (!token) {
    return
  }

  try {
    const decoded = verifyToken(token, 'admin')
    await prisma.userSession.deleteMany({
      where: { id: decoded.sessionId, userId: decoded.userId, kind: 'ADMIN' },
    })
  } catch {
    // Token không hợp lệ hoặc đã hết hạn -> phiên tương ứng cũng đã vô hiệu
  }
}
