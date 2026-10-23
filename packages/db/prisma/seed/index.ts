/**
 * Seed database — chạy bằng `pnpm db:seed` (idempotent: chạy lại nhiều lần không lỗi, dùng upsert theo khóa tự nhiên).
 *
 * - Luôn tạo: tài khoản Super Admin + danh mục sản phẩm.
 * - Dữ liệu demo (sản phẩm, tài khoản STAFF/CUSTOMER mẫu, đơn may đo, lịch hẹn, kho vải): bật mặc định ở local,
 *   tắt bằng `SEED_DEMO_DATA=false` khi seed production. Khi tắt demo bắt buộc đặt `SEED_ADMIN_PASSWORD`.
 * - Không bao giờ in mật khẩu ra console.
 */
import { prisma } from '../../src'
import { seedAccounts } from './accounts'
import { seedCatalog } from './catalog'
import { seedOperations } from './operations'
import { type SeedConfig } from './types'

function readConfig(): SeedConfig {
  const demo = process.env.SEED_DEMO_DATA?.trim().toLowerCase() !== 'false'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim()

  if (!demo && !adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD là bắt buộc khi SEED_DEMO_DATA=false (seed production).')
  }

  return {
    demo,
    admin: {
      email: (process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@gmail.com').toLowerCase(),
      password: adminPassword || 'admin123',
      phone: process.env.SEED_ADMIN_PHONE?.trim() || '0987654321',
    },
    demoPassword: process.env.SEED_DEMO_PASSWORD?.trim() || 'Demo@123',
  }
}

async function main() {
  const config = readConfig()
  console.log(`🌱 Seeding database (dữ liệu demo: ${config.demo ? 'BẬT' : 'TẮT'})`)

  const accounts = await seedAccounts(config)
  const catalog = await seedCatalog({ demo: config.demo })

  if (config.demo) {
    await seedOperations({ catalog, accounts })
  }

  console.log('🎉 Seed hoàn tất.')
}

main()
  .catch((error) => {
    console.error('❌ Seed thất bại:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
