import { prisma } from '../../src'
import { type SeededCatalog } from './types'

// Quy ước đa ngôn ngữ: cột gốc = tiếng Việt, cột `<field>En` = tiếng Anh

const CATEGORIES = [
  {
    slug: 'ao-dai-truyen-thong',
    name: 'Áo Dài Truyền Thống',
    nameEn: 'Traditional Ao Dai',
    description: 'Các mẫu áo dài mang nét đẹp cổ điển, kín đáo và sang trọng phong cách truyền thống.',
    descriptionEn: 'Classic, graceful ao dai in the timeless traditional style.',
  },
  {
    slug: 'ao-dai-cach-tan',
    name: 'Áo Dài Cách Tân',
    nameEn: 'Modern Ao Dai',
    description: 'Sự kết hợp giữa nét truyền thống và hơi thở hiện đại, trẻ trung, năng động.',
    descriptionEn: 'Tradition meets modern design — youthful and easy to wear.',
  },
  {
    slug: 'ao-dai-cuoi-hoi',
    name: 'Áo Dài Cưới & Hỏi',
    nameEn: 'Wedding Ao Dai',
    description: 'Các thiết kế lộng lẫy, thêu đính tinh xảo dành riêng cho ngày lễ trọng đại.',
    descriptionEn: 'Lavish, hand-embroidered designs for your engagement and wedding day.',
  },
  {
    slug: 'phu-kien-ao-dai',
    name: 'Phụ Kiện Áo Dài',
    nameEn: 'Ao Dai Accessories',
    description: 'Mấn, quần áo dài rời, trâm cài tóc, và các phụ kiện đi kèm khác.',
    descriptionEn: 'Headpieces, pants, hairpins and other accessories.',
  },
]

/**
 * `price` của biến thể chỉ khai báo khi KHÁC giá gốc (null = dùng basePrice của sản phẩm)
 */
const DEMO_PRODUCTS = [
  {
    slug: 'ao-dai-gam-hoa-sen-co-dien',
    categorySlug: 'ao-dai-truyen-thong',
    name: 'Áo Dài Gấm Hoa Sen Cổ Điển',
    nameEn: 'Classic Lotus Brocade Ao Dai',
    description:
      'Áo dài gấm cao cấp họa tiết hoa sen chìm tinh tế, phom dáng chuẩn truyền thống tôn vinh nét đẹp dịu dàng của người phụ nữ Việt Nam.',
    descriptionEn: 'Premium brocade with a subtle lotus pattern, cut in the traditional silhouette.',
    material: 'Gấm Thượng Hải cao cấp',
    materialEn: 'Premium Shanghai brocade',
    basePrice: 1_200_000,
    images: ['/images/ex1.jpg', '/images/ex2.jpg'],
    isFeatured: true,
    color: 'Hồng Sen',
    skuPrefix: 'AD-GHS',
    variants: [
      { size: 'S', stock: 15 },
      { size: 'M', stock: 20 },
      { size: 'L', stock: 10, price: 1_250_000 },
      { size: 'XL', stock: 5, price: 1_300_000 },
    ],
  },
  {
    slug: 'ao-dai-cach-tan-dang-suong-linen',
    categorySlug: 'ao-dai-cach-tan',
    name: 'Áo Dài Cách Tân Dáng Suông Linen',
    nameEn: 'Relaxed-fit Linen Modern Ao Dai',
    description:
      'Áo dài cách tân dáng suông trẻ trung, chất liệu linen tự nhiên mát mẻ thêu tay hoa nhí tỉ mỉ, phù hợp đi làm, dạo phố hoặc lễ tết.',
    descriptionEn: 'A relaxed modern cut in breathable linen with hand-embroidered florals.',
    material: 'Linen phối tơ Organza',
    materialEn: 'Linen with organza silk',
    basePrice: 850_000,
    images: ['/images/ex4.jpg'],
    isFeatured: false,
    color: 'Vàng Cúc',
    skuPrefix: 'AD-CTDS',
    variants: [
      { size: 'S', stock: 30 },
      { size: 'M', stock: 25 },
      { size: 'L', stock: 15, price: 900_000 },
    ],
  },
  {
    slug: 'ao-dai-cuoi-gam-do-phuong-hoang',
    categorySlug: 'ao-dai-cuoi-hoi',
    name: 'Áo Dài Cưới Gấm Đỏ Phượng Hoàng',
    nameEn: 'Red Phoenix Brocade Wedding Ao Dai',
    description:
      'Thêu tay Phượng Hoàng sắc nét trên nền lụa gấm ruby cao cấp, đính pha lê lấp lánh tôn dáng hoàn hảo cho cô dâu ngày trọng đại.',
    descriptionEn: 'Hand-embroidered phoenix on ruby silk brocade, finished with crystals.',
    material: 'Lụa Ruby cao cấp',
    materialEn: 'Premium ruby silk',
    basePrice: 2_800_000,
    images: ['/images/ex8.jpg'],
    isFeatured: true,
    color: 'Đỏ Nhung',
    skuPrefix: 'AD-CGD',
    variants: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 8 },
      { size: 'L', stock: 4, price: 2_900_000 },
    ],
  },
]

/** Slug sản phẩm demo dùng ở các bước seed khác */
export const DEMO_PRODUCT_SLUGS = {
  lotus: 'ao-dai-gam-hoa-sen-co-dien',
  linen: 'ao-dai-cach-tan-dang-suong-linen',
  wedding: 'ao-dai-cuoi-gam-do-phuong-hoang',
} as const

/**
 * Danh mục (luôn tạo) + sản phẩm & biến thể demo (chỉ khi bật demo)
 */
export async function seedCatalog({ demo }: { demo: boolean }): Promise<SeededCatalog> {
  const categoryIds: Record<string, string> = {}
  for (const { slug, ...data } of CATEGORIES) {
    const category = await prisma.category.upsert({ where: { slug }, update: data, create: { slug, ...data } })
    categoryIds[slug] = category.id
  }
  console.log(`   🗂️  ${CATEGORIES.length} danh mục`)

  const products: SeededCatalog = {}
  if (!demo) return products

  let variantCount = 0
  for (const { slug, categorySlug, color, skuPrefix, variants, ...data } of DEMO_PRODUCTS) {
    const productData = { ...data, categoryId: categoryIds[categorySlug] }
    const product = await prisma.product.upsert({ where: { slug }, update: productData, create: { slug, ...productData } })
    products[slug] = product

    for (const { size, stock, price } of variants) {
      const sku = `${skuPrefix}-${size}`
      const variantData = { size, color, stock, price: price ?? null, productId: product.id }
      await prisma.productVariant.upsert({ where: { sku }, update: variantData, create: { sku, ...variantData } })
      variantCount++
    }
  }
  console.log(`   📦 ${DEMO_PRODUCTS.length} sản phẩm demo, ${variantCount} biến thể`)

  return products
}
