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
        'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800'
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
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800'
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
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800'
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

  console.log('\n🎉 Seeding database successfully completed!')
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })