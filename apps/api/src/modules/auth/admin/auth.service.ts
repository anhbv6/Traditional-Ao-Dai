import { prisma } from '@repo/db'
import { comparePassword } from '../../../shared/utils/password'
import { generateAccessToken, generateToken } from '../../../shared/utils/jwt'
import { AppError } from '../../../shared/middlewares/errorHandler'
import { LoginInput } from '../auth.schema'

/**
 * Validates admin and staff credentials and generates a JWT access token.
 */
export async function adminLogin(input: LoginInput['body']) {
  const { email, password, rememberMe } = input

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      staffPermission: true,
    },
  })

  // Check user existence, verify they are an ADMIN or STAFF, and ensure active status
  if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    throw new AppError(401, 'ADMIN_UNAUTHORIZED')
  }

  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED')
  }

  // Verify password
  const isPasswordMatch = await comparePassword(password, user.password || '')
  if (!isPasswordMatch) {
    throw new AppError(401, 'INCORRECT_PASSWORD')
  }

  // Generate JWT token containing key user claims
  // Nếu rememberMe = true: token tồn tại 7 ngày; nếu false: 1 ngày
  const tokenExpiresIn = rememberMe ? '7d' : '1d'
  const token = generateToken(
    {
      userId: user.id,
      role: user.role,
      tokenType: 'access',
      rememberMe: Boolean(rememberMe),
    },
    tokenExpiresIn
  )

  // Return user info excluding password and include token
  const { password: _, ...safeUser } = user
  return {
    token,
    accessToken: token,
    user: safeUser,
  }
}

/**
 * Revokes session and handles admin/staff logout
 */
export async function adminLogout(userId?: string) {
  if (userId) {
    // Invalidate any active user sessions if applicable
    await prisma.userSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    }).catch(() => null)
  }
  return { success: true }
}
