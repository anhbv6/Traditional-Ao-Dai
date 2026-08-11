import { prisma } from '@repo/db'
import { comparePassword } from '../../../shared/utils/password'
import { generateToken } from '../../../shared/utils/jwt'
import { AppError } from '../../../shared/middlewares/errorHandler'
import { LoginInput } from '../auth.schema'

/**
 * Validates admin credentials and generates a JWT access token.
 */
export async function adminLogin(input: LoginInput['body']) {
  const { email, password } = input

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  })

  // Check user existence, verify they are an ADMIN, and ensure active status
  if (!user || user.role !== 'ADMIN') {
    throw new AppError(401, 'Tài khoản không tồn tại hoặc không có quyền truy cập Admin')
  }

  if (!user.isActive) {
    throw new AppError(403, 'Tài khoản này đã bị khóa hoặc ngưng hoạt động')
  }

  // Verify password
  const isPasswordMatch = await comparePassword(password, user.password || '')
  if (!isPasswordMatch) {
    throw new AppError(401, 'Mật khẩu không chính xác')
  }

  // Generate JWT token containing key user claims
  const token = generateToken({
    userId: user.id,
    role: user.role,
  })

  // Return user info excluding password and include token
  const { password: _, ...safeUser } = user
  return {
    token,
    user: safeUser,
  }
}

/**
 * Retrieves a user by their unique database identifier.
 */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw new AppError(404, 'Không tìm thấy người dùng')
  }

  const { password: _, ...safeUser } = user
  return safeUser
}
