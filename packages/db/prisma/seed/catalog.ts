import { prisma, type SaleMode } from '../../src'
import { seedTaxonomy } from './taxonomy'
import { type SeededCatalog } from './types'

// Quy ước đa ngôn ngữ: cột gốc = tiếng Việt, cột `<field>En` = tiếng Anh

/**
 * `price` của biến thể chỉ khai báo khi KHÁC giá gốc (null = dùng basePrice của sản phẩm)
 */
const DEMO_PRODUCTS: {
  slug: string
  categorySlug: string
  code: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  saleMode: SaleMode
  isCustomFit: boolean
  setItems?: { label: string; labelEn: string; quantity: number; materialId: null }[]
  materialCode: string
  colorCode: string
  basePrice: number
  images: string[]
  isFeatured: boolean
  variants: { size: string; stock: number; price?: number }[]
}[] = [
  {
    slug: 'ao-dai-gam-hoa-sen-co-dien',
    categorySlug: 'ao-dai-truyen-thong',
    name: 'Áo Dài Gấm Hoa Sen Cổ Điển',
    nameEn: 'Classic Lotus Brocade Ao Dai',
    description:
      'Áo dài gấm cao cấp họa tiết hoa sen chìm tinh tế, phom dáng chuẩn truyền thống tôn vinh nét đẹp dịu dàng của người phụ nữ Việt Nam.',
    descriptionEn: 'Premium brocade with a subtle lotus pattern, cut in the traditional silhouette.',
    code: 'AD0001',
    saleMode: 'SINGLE',
    isCustomFit: true,
    materialCode: 'GAM-RUBY',
    basePrice: 1_200_000,
    images: ['/images/ex1.jpg', '/images/ex2.jpg'],
    isFeatured: true,
    colorCode: 'HONG-SEN',
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
    code: 'AD0002',
    saleMode: 'SINGLE',
    isCustomFit: true,
    materialCode: 'LINEN-THO',
    basePrice: 850_000,
    images: ['/images/ex4.jpg'],
    isFeatured: false,
    colorCode: 'VANG-CUC',
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
    code: 'AD0003',
    // Bộ cưới: áo + quần + khăn đóng — bán chung một giá, một size bộ
    saleMode: 'SET',
    isCustomFit: true,
    setItems: [
      { label: 'Áo dài', labelEn: 'Áo dài top', quantity: 1, materialId: null },
      { label: 'Quần', labelEn: 'Pants', quantity: 1, materialId: null },
      { label: 'Khăn đóng', labelEn: 'Khăn đóng headpiece', quantity: 1, materialId: null },
    ],
    materialCode: 'GAM-RUBY',
    basePrice: 2_800_000,
    images: ['/images/ex8.jpg'],
    isFeatured: true,
    colorCode: 'DO-NHUNG',
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
export async function seedCatalog({
  demo,
  materials,
}: {
  demo: boolean
  /** Mã chất liệu → id (chỉ có khi bật demo) */
  materials: Record<string, string>
}): Promise<SeededCatalog> {
  const categoryIds = await seedTaxonomy()

  const products: SeededCatalog = {}
  if (!demo) return products

  const colors = await prisma.attributeValue.findMany({ where: { group: 'COLOR' }, select: { id: true, code: true, name: true } })
  let variantCount = 0
  for (const { slug, categorySlug, code, colorCode, materialCode, variants, setItems, ...data } of DEMO_PRODUCTS) {
    const productData = {
      ...data,
      setItems: setItems ?? [],
      categoryId: categoryIds[categorySlug],
      materialId: materials[materialCode] ?? null,
    }
    // Mã sản phẩm chỉ đặt lúc tạo — không đổi mã của sản phẩm đã có (SKU đã in tem)
    const product = await prisma.product.upsert({
      where: { slug },
      update: productData,
      create: { slug, code, ...productData },
    })
    products[slug] = product

    const color = colors.find((c) => c.code === colorCode) ?? null
    for (const { size, stock, price } of variants) {
      const variantData = { size, color: color?.name ?? null, colorId: color?.id ?? null, stock, price: price ?? null }
      // Khớp theo sản phẩm + màu + size để chạy lại seed không sinh SKU trùng tổ hợp (kể cả DB có SKU kiểu cũ)
      const existing = await prisma.productVariant.findFirst({
        where: { productId: product.id, size, color: variantData.color },
        select: { id: true },
      })
      if (existing) await prisma.productVariant.update({ where: { id: existing.id }, data: variantData })
      else {
        const sku = [product.code, colorCode.replace(/-/g, ''), size].join('-')
        await prisma.productVariant.create({ data: { ...variantData, sku, productId: product.id } })
      }
      variantCount++
    }
  }
  console.log(`   📦 ${DEMO_PRODUCTS.length} sản phẩm demo, ${variantCount} biến thể`)

  return products
}
