import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@gmail.com'
  const adminPassword = '123'

  // 1. Kiểm tra chính xác xem email này đã tồn tại trong DB chưa
  const existingUser = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  })

  if (existingUser) {
    console.log(`⚠️ Email ${adminEmail} đã tồn tại trong hệ thống. Bỏ qua khởi tạo Admin.`)
    return
  }

  // 2. Hash mật khẩu bằng bcryptjs
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  // 3. Tạo tài khoản Admin mặc định
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Shop Owner Admin',
      password: hashedPassword,
      phone: '0987654321', // Sửa phoneNumber thành phone cho đúng schema
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true, // Admin khởi tạo mặc định đã verify email
    },
  })

  console.log('✅ Seeded database successfully!')
  console.log(`👤 Admin email: ${admin.email}`)
  console.log(`🔑 Admin password: ${adminPassword}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })