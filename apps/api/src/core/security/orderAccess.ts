import { randomBytes } from 'crypto'
import { prisma, type Prisma } from '@repo/db'
import { AppError } from '../http/AppError'
import { hashToken } from './session'

/** Hạn của link tra cứu đơn — đủ dài cho đơn may đo (may + giao + bảo hành sửa form) */
export const ORDER_ACCESS_TOKEN_TTL_DAYS = 120

type Db = Prisma.TransactionClient | typeof prisma

/**
 * Tạo token READ cho một đơn (magic link). Token gốc 256 bit ngẫu nhiên chỉ trả về MỘT lần cho người đặt / chủ đơn;
 * DB chỉ lưu SHA-256 nên lộ DB cũng không mở được đơn. Token không cấp quyền sửa — sửa phải qua OTP SĐT của đơn.
 */
export async function createOrderAccessToken(orderId: string, db: Db = prisma): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await db.orderAccessToken.create({
    data: {
      orderId,
      tokenHash: hashToken(token),
      scope: 'READ',
      expiresAt: new Date(Date.now() + ORDER_ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  })
  return token
}

/**
 * Đổi token gốc → orderId. Token sai / hết hạn / bị thu hồi đều trả cùng một lỗi ORDER_LINK_INVALID.
 */
export async function resolveOrderAccessToken(token: string): Promise<string> {
  const record = await prisma.orderAccessToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, orderId: true, expiresAt: true, revokedAt: true },
  })
  if (!record || record.revokedAt || record.expiresAt <= new Date()) {
    throw new AppError(404, 'ORDER_LINK_INVALID')
  }
  await prisma.orderAccessToken.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
  return record.orderId
}
