import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@aodai.com'
  const adminPassword = 'AdminPassword123'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: adminEmail,
      role: 'ADMIN',
    },
  })

  if (existingAdmin) {
    console.log('Admin user already exists.')
    return
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Shop Owner Admin',
      password: hashedPassword,
      role: 'ADMIN',
      phoneNumber: '0987654321',
      isActive: true,
    },
  })

  console.log('Seeded database successfully.')
  console.log(`Admin email: ${admin.email}`)
  console.log(`Admin password: ${adminPassword}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
