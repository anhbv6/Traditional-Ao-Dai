import bcrypt from 'bcryptjs'
import { prisma, type Permission, type Prisma, type User } from '../../src'
import { type SeedConfig, type SeededAccounts } from './types'

interface AccountSeed {
  email: string
  phone: string
  name: string
  password: string
  role: User['role']
  permissions?: Permission[]
}

/**
 * Tạo tài khoản nếu chưa có; đã có thì chỉ đảm bảo vai trò, quyền và trạng thái hoạt động.
 * KHÔNG ghi đè mật khẩu / SĐT của tài khoản đã tồn tại (người dùng có thể đã đổi).
 */
async function upsertAccount(seed: AccountSeed): Promise<User> {
  const now = new Date()
  const update: Prisma.UserUpdateInput = { role: seed.role, status: 'ACTIVE', lockedAt: null, lockedReason: null }
  if (seed.permissions) update.permissions = seed.permissions

  return prisma.user.upsert({
    where: { email: seed.email },
    update,
    create: {
      email: seed.email,
      emailVerifiedAt: now,
      phone: seed.phone,
      phoneVerifiedAt: now,
      name: seed.name,
      passwordHash: await bcrypt.hash(seed.password, 10),
      passwordChangedAt: now,
      role: seed.role,
      permissions: seed.permissions ?? [],
    },
  })
}

/**
 * Super Admin (luôn tạo) + tài khoản STAFF / CUSTOMER mẫu để thử phân quyền (chỉ khi bật demo)
 */
export async function seedAccounts(config: SeedConfig): Promise<SeededAccounts> {
  const admin = await upsertAccount({ ...config.admin, name: 'System Admin', role: 'ADMIN' })
  console.log(`   👤 ADMIN    ${admin.email}`)

  if (!config.demo) {
    return { admin, staff: null, customer: null }
  }

  const staff = await upsertAccount({
    email: 'staff@aodai.local',
    phone: '0900000001',
    name: 'Nhân viên Demo',
    password: config.demoPassword,
    role: 'STAFF',
    // Quyền vận hành cơ bản; báo cáo, kho, nội dung để Super Admin cấp thêm khi cần
    permissions: ['MANAGE_ORDERS', 'UPDATE_TAILORING'],
  })
  const customer = await upsertAccount({
    email: 'customer@aodai.local',
    phone: '0900000002',
    name: 'Khách hàng Demo',
    password: config.demoPassword,
    role: 'CUSTOMER',
  })

  await prisma.userMeasurement.upsert({
    where: { id: '7f1c2a10-0000-4000-8000-0000000000a1' },
    update: {},
    create: {
      id: '7f1c2a10-0000-4000-8000-0000000000a1',
      userId: customer.id,
      profileName: 'Số đo của tôi',
      isDefault: true,
      height: 160,
      weight: 48,
      bust: 82,
      waist: 64,
      hips: 88,
      shoulder: 36,
      armLength: 56,
      shirtLength: 128,
      pantsLength: 102,
    },
  })

  console.log(`   👤 STAFF    ${staff.email}`)
  console.log(`   👤 CUSTOMER ${customer.email} (kèm 1 hồ sơ số đo)`)
  return { admin, staff, customer }
}
