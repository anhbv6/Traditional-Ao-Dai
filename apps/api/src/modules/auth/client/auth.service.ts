import { prisma } from '@repo/db'
import { comparePassword, hashPassword } from '../../../shared/utils/password'
import { generateToken } from '../../../shared/utils/jwt'
import { AppError } from '../../../shared/middlewares/errorHandler'
import { LoginInput, RegisterInput } from '../auth.schema'

/**
 * Validates client credentials and generates a JWT access token.
 */
export async function clientLogin(input: LoginInput['body']) {
  const { email, password } = input

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  })

  // Check user existence, verify they are a CUSTOMER
  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(401, 'Tài khoản không tồn tại hoặc không phải là tài khoản khách hàng')
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
 * Registers a new client (customer).
 */
export async function clientRegister(input: RegisterInput['body']) {
  const { email, password, name, phone } = input

  // Check email conflict
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })
  if (existingUser) {
    throw new AppError(400, 'Email này đã được đăng ký sử dụng')
  }

  // Check phone conflict if provided
  if (phone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    })
    if (existingPhone) {
      throw new AppError(400, 'Số điện thoại này đã được đăng ký sử dụng')
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create client in DB
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      role: 'CUSTOMER',
    },
  })

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    role: user.role,
  })

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
