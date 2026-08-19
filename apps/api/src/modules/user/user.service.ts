import { prisma } from '@repo/db'
import { AppError } from '../../shared/middlewares/errorHandler'

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(404, 'User not found.')
  }

  if (!user.isActive) {
    throw new AppError(403, 'This account has been locked or deactivated.')
  }

  const { password: _, ...safeUser } = user
  return safeUser
}