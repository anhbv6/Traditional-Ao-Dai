import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Cấu hình Admin từ Environment Variables (an toàn thực tế) hoặc fallback mặc định
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@gmail.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123'
  const adminPhone = process.env.SEED_ADMIN_PHONE || '0987654321'

  // Hash mật khẩu admin
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  // Sử dụng upsert để đảm bảo tính Idempotency (chạy đi chạy lại nhiều lần không lỗi và không bị bỏ qua)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'System Admin',
      phone: adminPhone,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    },
    create: {
      email: adminEmail,
      name: 'System Admin',
      password: hashedPassword,
      phone: adminPhone,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    },
  })

  console.log('👥 Admin user processed:')
  console.log(`   - Email: ${admin.email}`)
  console.log(`   - Password: ${adminPassword} (hashed in DB)`)
  console.log(`   - Role: ${admin.role}`)

  // 2. Khởi tạo dữ liệu Danh mục (Categories) cho cửa hàng Áo Dài
  console.log('\n🗂️ Seeding categories...')
  const categoriesData = [
    {
      name: 'Áo Dài Truyền Thống',
      slug: 'ao-dai-truyen-thong',
      description: 'Các mẫu áo dài mang nét đẹp cổ điển, kín đáo và sang trọng phong cách truyền thống.',
    },
    {
      name: 'Áo Dài Cách Tân',
      slug: 'ao-dai-cach-tan',
      description: 'Sự kết hợp giữa nét truyền thống và hơi thở hiện đại, trẻ trung, năng động.',
    },
    {
      name: 'Áo Dài Cưới & Hỏi',
      slug: 'ao-dai-cuoi-hoi',
      description: 'Các thiết kế lộng lẫy, thêu đính tinh xảo dành riêng cho ngày lễ trọng đại.',
    },
    {
      name: 'Phụ Kiện Áo Dài',
      slug: 'phu-kien-ao-dai',
      description: 'Mấn, quần áo dài rời, trâm cài tóc, và các phụ kiện đi kèm khác.',
    },
  ]

  const categories = []
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
      },
      create: cat,
    })
    categories.push(createdCat)
    console.log(`   ✅ Category: ${createdCat.name} (${createdCat.slug})`)
  }

  // 3. Khởi tạo sản phẩm mẫu (Products & Variants) giúp kiểm thử FE/BE lập tức
  console.log('\n👕 Seeding sample products and variants...')
  const productsData = [
    {
      name: 'Áo Dài Gấm Hoa Sen Cổ Điển',
      slug: 'ao-dai-gam-hoa-sen-co-dien',
      description: 'Áo dài gấm cao cấp họa tiết hoa sen chìm tinh tế, phom dáng chuẩn truyền thống tôn vinh nét đẹp dịu dàng của người phụ nữ Việt Nam.',
      material: 'Gấm Thượng Hải Cao Cấp',
      basePrice: 1200000,
      images: [
        '/images/ex1.jpg',
        '/images/ex2.jpg'
      ],
      isCustomFit: true,
      categorySlug: 'ao-dai-truyen-thong',
      variants: [
        { sku: 'AD-GHS-S', size: 'S', color: 'Hồng Sen', stock: 15, price: 1200000 },
        { sku: 'AD-GHS-M', size: 'M', color: 'Hồng Sen', stock: 20, price: 1200000 },
        { sku: 'AD-GHS-L', size: 'L', color: 'Hồng Sen', stock: 10, price: 1250000 },
        { sku: 'AD-GHS-XL', size: 'XL', color: 'Hồng Sen', stock: 5, price: 1300000 },
      ]
    },
    {
      name: 'Áo Dài Cách Tân Dáng Suông Linen',
      slug: 'ao-dai-cach-tan-dang-suong-linen',
      description: 'Áo dài cách tân dáng suông trẻ trung năng động, chất liệu linen tự nhiên mát mẻ thêu tay hoa nhí tỉ mỉ phù hợp mặc đi làm, dạo phố hoặc lễ tết.',
      material: 'Linen phối tơ Organza',
      basePrice: 850000,
      images: [
        '/images/ex4.jpg'
      ],
      isCustomFit: true,
      categorySlug: 'ao-dai-cach-tan',
      variants: [
        { sku: 'AD-CTDS-S', size: 'S', color: 'Vàng Cúc', stock: 30, price: 850000 },
        { sku: 'AD-CTDS-M', size: 'M', color: 'Vàng Cúc', stock: 25, price: 850000 },
        { sku: 'AD-CTDS-L', size: 'L', color: 'Vàng Cúc', stock: 15, price: 900000 },
      ]
    },
    {
      name: 'Áo Dài Cưới Gấm Đỏ Phượng Hoàng',
      slug: 'ao-dai-cuoi-gam-do-phuong-hoang',
      description: 'Tác phẩm nghệ thuật thêu tay Phượng Hoàng sắc nét trên nền vải lụa gấm ruby cao cấp, đính pha lê lấp lánh sang trọng tôn dáng hoàn hảo cho cô dâu ngày trọng đại.',
      material: 'Lụa Ruby Cao Cấp',
      basePrice: 2800000,
      images: [
        '/images/ex8.jpg'
      ],
      isCustomFit: true,
      categorySlug: 'ao-dai-cuoi-hoi',
      variants: [
        { sku: 'AD-CGD-S', size: 'S', color: 'Đỏ Nhung', stock: 5, price: 2800000 },
        { sku: 'AD-CGD-M', size: 'M', color: 'Đỏ Nhung', stock: 8, price: 2800000 },
        { sku: 'AD-CGD-L', size: 'L', color: 'Đỏ Nhung', stock: 4, price: 2900000 },
      ]
    }
  ]

  for (const prod of productsData) {
    const category = categories.find(c => c.slug === prod.categorySlug)
    if (!category) {
      console.log(`   ⚠️ Skipped product ${prod.name}: Category ${prod.categorySlug} not found.`)
      continue
    }

    // Upsert sản phẩm chính
    const createdProduct = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        description: prod.description,
        material: prod.material,
        basePrice: prod.basePrice,
        images: prod.images,
        isCustomFit: prod.isCustomFit,
        categoryId: category.id,
      },
      create: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        material: prod.material,
        basePrice: prod.basePrice,
        images: prod.images,
        isCustomFit: prod.isCustomFit,
        categoryId: category.id,
      },
    })

    console.log(`   📦 Product: ${createdProduct.name}`)

    // Upsert các biến thể (Variants) đi kèm sản phẩm
    for (const v of prod.variants) {
      const createdVariant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          size: v.size,
          color: v.color,
          price: v.price,
          stock: v.stock,
          productId: createdProduct.id,
        },
        create: {
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          stock: v.stock,
          productId: createdProduct.id,
        },
      })
      console.log(`      🔹 Variant SKU [${createdVariant.sku}] - Size: ${createdVariant.size}, Color: ${createdVariant.color}, Stock: ${createdVariant.stock}`)
    }
  }

  await seedOperations()

  console.log('\n🎉 Seeding database successfully completed!')
}

/**
 * Dữ liệu vận hành mẫu cho dashboard admin: đơn may đo ở từng công đoạn (có cọc + ngày hẹn trả),
 * lịch hẹn trong hôm nay và các cây vải (có cây sắp hết). Ngày giờ tính theo thời điểm chạy seed.
 * Idempotent: đơn theo orderNumber, vải theo code, lịch hẹn theo id cố định.
 */
async function seedOperations() {
  console.log('\n🧵 Seeding dashboard operations (orders, appointments, fabrics)...')

  const products = await prisma.product.findMany({
    where: { slug: { in: ['ao-dai-gam-hoa-sen-co-dien', 'ao-dai-cach-tan-dang-suong-linen', 'ao-dai-cuoi-gam-do-phuong-hoang'] } },
  })
  const bySlug = (slug: string) => products.find((p) => p.slug === slug)
  const gamHoaSen = bySlug('ao-dai-gam-hoa-sen-co-dien')
  const linen = bySlug('ao-dai-cach-tan-dang-suong-linen')
  const cuoi = bySlug('ao-dai-cuoi-gam-do-phuong-hoang')
  if (!gamHoaSen || !linen || !cuoi) {
    console.log('   ⚠️ Skipped: sample products not found.')
    return
  }

  const DAY = 24 * 60 * 60 * 1000
  const now = Date.now()
  const inDays = (days: number) => new Date(now + days * DAY)
  // Giờ hôm nay theo giờ Việt Nam (UTC+7), VD todayAt(9, 30) = 09:30 hôm nay
  const todayAt = (hour: number, minute = 0) => {
    const vn = new Date(now + 7 * 60 * 60 * 1000)
    return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate(), hour - 7, minute))
  }

  const measurements = { height: 160, weight: 48, bust: 82, waist: 64, hips: 88, shoulder: 36, shirtLength: 128, pantsLength: 102 }

  const orders = [
    { orderNumber: 'AD-SEED-0001', customerName: 'Nguyễn Thị Lan', customerPhone: '0901000001', product: cuoi, price: 2800000, orderStatus: 'PENDING', paymentStatus: 'UNPAID', paid: 0, tailoring: 'NOT_APPLICABLE', dueIn: 12 },
    { orderNumber: 'AD-SEED-0002', customerName: 'Trần Thu Hà', customerPhone: '0901000002', product: gamHoaSen, price: 1200000, orderStatus: 'CONFIRMED', paymentStatus: 'PARTIALLY_PAID', paid: 600000, tailoring: 'WAITING_FABRIC', dueIn: 6 },
    { orderNumber: 'AD-SEED-0003', customerName: 'Lê Minh Châu', customerPhone: '0901000003', product: linen, price: 850000, orderStatus: 'IN_PRODUCTION', paymentStatus: 'PARTIALLY_PAID', paid: 425000, tailoring: 'SEWING', dueIn: 2 },
    { orderNumber: 'AD-SEED-0004', customerName: 'Phạm Ngọc Mai', customerPhone: '0901000004', product: cuoi, price: 2800000, orderStatus: 'IN_PRODUCTION', paymentStatus: 'PARTIALLY_PAID', paid: 1400000, tailoring: 'EMBROIDERY_BEADING', dueIn: 3 },
    { orderNumber: 'AD-SEED-0005', customerName: 'Võ Thanh Tâm', customerPhone: '0901000005', product: gamHoaSen, price: 1200000, orderStatus: 'IN_PRODUCTION', paymentStatus: 'PARTIALLY_PAID', paid: 600000, tailoring: 'FITTING_IRONING', dueIn: 1 },
    { orderNumber: 'AD-SEED-0006', customerName: 'Đặng Bảo Ngọc', customerPhone: '0901000006', product: linen, price: 850000, orderStatus: 'READY_TO_SHIP', paymentStatus: 'PARTIALLY_PAID', paid: 425000, tailoring: 'COMPLETED', dueIn: 2 },
  ] as const

  const createdOrders: Record<string, string> = {}
  for (const o of orders) {
    const order = await prisma.order.upsert({
      where: { orderNumber: o.orderNumber },
      update: {
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paidAmount: o.paid,
        dueDate: inDays(o.dueIn),
      },
      create: {
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: `${o.orderNumber.toLowerCase()}@example.com`,
        customerPhone: o.customerPhone,
        shippingAddress: 'Nhận tại tiệm',
        subTotal: o.price,
        totalAmount: o.price,
        paidAmount: o.paid,
        dueDate: inDays(o.dueIn),
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: 'BANK_TRANSFER',
        items: {
          create: {
            productId: o.product.id,
            productName: o.product.name,
            quantity: 1,
            unitPrice: o.price,
            totalPrice: o.price,
            isCustomFit: true,
            tailoringStatus: o.tailoring,
            ...measurements,
          },
        },
      },
    })
    createdOrders[o.orderNumber] = order.id
    console.log(`   🧾 Order ${o.orderNumber} — ${o.orderStatus} / ${o.tailoring}`)
  }

  const appointments = [
    { id: '7f1c2a10-0000-4000-8000-000000000001', customerName: 'Nguyễn Thị Lan', customerPhone: '0901000001', type: 'MEASUREMENT', at: todayAt(9, 30), note: 'Đo áo dài cưới', orderNumber: 'AD-SEED-0001' },
    { id: '7f1c2a10-0000-4000-8000-000000000002', customerName: 'Phạm Ngọc Mai', customerPhone: '0901000004', type: 'FITTING', at: todayAt(14, 0), note: 'Thử áo lụa hồng, sửa lại eo', orderNumber: 'AD-SEED-0004' },
    { id: '7f1c2a10-0000-4000-8000-000000000003', customerName: 'Võ Thanh Tâm', customerPhone: '0901000005', type: 'FITTING', at: todayAt(16, 30), note: 'Thử form lần cuối', orderNumber: 'AD-SEED-0005' },
    { id: '7f1c2a10-0000-4000-8000-000000000004', customerName: 'Hoàng Kim Oanh', customerPhone: '0901000007', type: 'MEASUREMENT', at: todayAt(18, 0), note: 'Khách mới, may áo dài đi lễ', orderNumber: null },
  ] as const

  for (const a of appointments) {
    const data = {
      customerName: a.customerName,
      customerPhone: a.customerPhone,
      type: a.type,
      status: 'SCHEDULED' as const,
      scheduledAt: a.at,
      note: a.note,
      orderId: a.orderNumber ? createdOrders[a.orderNumber] : null,
    }
    await prisma.appointment.upsert({ where: { id: a.id }, update: data, create: { id: a.id, ...data } })
  }
  console.log(`   📅 Appointments today: ${appointments.length}`)

  const fabrics = [
    { code: 'LUA-HONG-01', name: 'Lụa tơ tằm hồng phấn', color: 'Hồng phấn', remainingMeters: 2.4, productId: gamHoaSen.id },
    { code: 'GAM-DO-01', name: 'Gấm ruby đỏ nhung', color: 'Đỏ nhung', remainingMeters: 1.6, productId: cuoi.id },
    { code: 'LINEN-VANG-01', name: 'Linen vàng cúc', color: 'Vàng cúc', remainingMeters: 14, productId: linen.id },
    { code: 'VOAN-TRANG-01', name: 'Voan lụa trắng', color: 'Trắng', remainingMeters: 2.9, productId: null },
  ]
  for (const f of fabrics) {
    await prisma.fabric.upsert({ where: { code: f.code }, update: f, create: f })
  }
  console.log(`   🧶 Fabrics: ${fabrics.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })