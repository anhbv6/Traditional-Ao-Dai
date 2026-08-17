import { prisma } from '@repo/db'
import { AppError } from '../../shared/middlewares/errorHandler'

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user || user.role !== 'CUSTOMER') {
    throw new AppError(404, 'Không tìm thấy người dùng')
  }

  if (!user.isActive) {
    throw new AppError(403, 'TÃ i khoáº£n nÃ y Ä‘Ã£ bá»‹ khÃ³a hoáº·c ngÆ°ng hoáº¡t Ä‘á»™ng')
  }

  const { password: _, ...safeUser } = user
  return safeUser
}