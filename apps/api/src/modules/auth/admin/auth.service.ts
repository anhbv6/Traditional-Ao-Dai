import { prisma } from '@repo/db'
import { randomBytes, randomUUID } from 'crypto'
import { comparePassword } from '../../../shared/utils/password'
import { generateToken, verifyToken } from '../../../shared/utils/jwt'
import { AppError } from '../../../shared/middlewares/errorHandler'
import { durationToMs } from '../../../shared/utils/time'
import { cleanupUserSessions, hashToken } from '../../../shared/utils/session'
import { LoginInput } from '../auth.schema'
import { SessionMeta } from '../auth.types'

/**
 * Admin / Staff login.
 * - Mỗi lần đăng nhập tạo một UserSession; token mang sessionId để có thể thu hồi (đăng xuất, khóa tài khoản)
 * - Không phân biệt "sai tài khoản" và "sai mật khẩu" để tránh dò email quản trị
 */
export async function adminLogin(input: LoginInput['body'], meta: SessionMeta = {}) {
  const email = input.email.trim().toLowerCase()
  const { password, rememberMe } = input

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: {
      staffPermission: true,
    },
  })

  const isPasswordMatch =
    !!user &&
    (user.role === 'ADMIN' || user.role === 'STAFF') &&
    !!user.password &&
    (await comparePassword(password, user.password))

  if (!user || !isPasswordMatch) {
    throw new AppError(401, 'INVALID_CREDENTIALS')
  }

  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }

  // Nếu rememberMe = true: phiên tồn tại 7 ngày; nếu false: 1 ngày
  const tokenExpiresIn = rememberMe ? '7d' : '1d'
  const expiresAt = new Date(Date.now() + durationToMs(tokenExpiresIn))
  const sessionId = randomUUID()

  await cleanupUserSessions(user.id)

  await prisma.userSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      // Admin không dùng refresh token: lưu hash của một chuỗi ngẫu nhiên để thỏa ràng buộc unique
      refreshToken: hashToken(randomBytes(32).toString('hex')),
      familyId: sessionId,
      deviceInfo: meta.deviceInfo,
      ipAddress: meta.ipAddress,
      expiresAt,
    },
  })

  const token = generateToken(
    {
      userId: user.id,
      role: user.role,
      sessionId,
      tokenType: 'access',
      rememberMe: Boolean(rememberMe),
    },
    tokenExpiresIn
  )

  const { password: _, ...safeUser } = user

  // Token chỉ được đặt vào cookie httpOnly ở controller, không trả về body cho JavaScript đọc
  return {
    token,
    expiresAt,
    rememberMe: Boolean(rememberMe),
    user: safeUser,
  }
}

/**
 * Admin / Staff logout: thu hồi đúng phiên của token (nếu token còn hợp lệ).
 * Không ném lỗi khi token hỏng/hết hạn — controller vẫn luôn xóa cookie.
 */
export async function adminLogout(token?: string) {
  if (!token) {
    return { success: true }
  }

  try {
    const decoded = verifyToken(token)
    if (decoded.sessionId) {
      await prisma.userSession.deleteMany({
        where: { id: decoded.sessionId, userId: decoded.userId },
      })
    }
  } catch {
    // Token không hợp lệ hoặc đã hết hạn -> phiên tương ứng cũng đã vô hiệu
  }

  return { success: true }
}
