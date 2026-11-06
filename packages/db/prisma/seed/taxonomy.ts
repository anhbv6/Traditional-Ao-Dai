import { prisma, type Prisma, type ProductGroup } from '../../src'
import { PRODUCT_GROUP_NAMES } from '@repo/shared/sizing'

// Cây loại sản phẩm + bảng size mẫu. Idempotent và KHÔNG ghi đè chỉnh sửa của admin:
// - Loại sản phẩm: tạo mới nếu chưa có; loại cũ còn nằm ở gốc (dữ liệu trước khi có cây) được gắn vào nhóm cha.
// - Bảng size: tạo nếu chưa có bảng cùng tên; loại sản phẩm chỉ nhận bảng mặc định khi đang trống.

// Nhóm hàng (bản chất: may đo, đơn vị bán, có size) khai ở NHÓM GỐC; loại con luôn thừa hưởng, không khai riêng.
// Bảng size chỉ gắn ở loại con — nhóm gốc không có bảng size.
interface CategoryLeaf {
  slug: string
  name: string
  nameEn: string
  sizeChart?: string
}

interface CategoryNode extends Omit<CategoryLeaf, 'sizeChart'> {
  group: ProductGroup
  children?: CategoryLeaf[]
}

const CATEGORY_TREE: CategoryNode[] = [
  {
    // Mỗi nhóm hàng đúng một nhóm gốc (cố định, admin không tạo / xóa); nữ / nam / trẻ em là các loại bên trong
    slug: 'ao-dai',
    ...PRODUCT_GROUP_NAMES.AO_DAI,
    group: 'AO_DAI',
    children: [
      {
        slug: 'ao-dai-truyen-thong',
        name: 'Áo dài truyền thống',
        nameEn: 'Traditional ao dai',
        sizeChart: 'traditional',
      },
      {
        slug: 'ao-dai-cach-tan',
        name: 'Áo dài cách tân',
        nameEn: 'Modern ao dai',
        sizeChart: 'modern',
      },
      {
        slug: 'ao-dai-cuoi-hoi',
        name: 'Áo dài cưới / lễ hội',
        nameEn: 'Wedding & festive ao dai',
        sizeChart: 'traditional',
      },
      {
        slug: 'ao-dai-ba-sui',
        name: 'Áo dài bà sui',
        nameEn: 'Mother of the bride ao dai',
        sizeChart: 'matron',
      },
      { slug: 'ao-dai-suong', name: 'Áo dài suông', nameEn: 'Loose-fit ao dai', sizeChart: 'modern' },
      { slug: 'co-phuc-nhat-binh', name: 'Cổ phục / Nhật bình', nameEn: 'Heritage robes / Nhat binh' },
      {
        slug: 'ao-dai-ngu-than',
        name: 'Áo dài ngũ thân',
        nameEn: 'Five-panel ao dai',
        sizeChart: 'men',
      },
      {
        slug: 'ao-dai-cach-tan-nam',
        name: 'Áo dài cách tân nam',
        nameEn: "Men's modern ao dai",
        sizeChart: 'men',
      },
      { slug: 'ao-dai-be-trai', name: 'Áo dài bé trai', nameEn: "Boys' ao dai", sizeChart: 'kids' },
      { slug: 'ao-dai-be-gai', name: 'Áo dài bé gái', nameEn: "Girls' ao dai", sizeChart: 'kids' },
    ],
  },
  {
    slug: 'quan-ao-dai',
    ...PRODUCT_GROUP_NAMES.PANTS,
    group: 'PANTS',
    children: [
      {
        slug: 'quan-lua-ong-rong',
        name: 'Quần lụa ống rộng',
        nameEn: 'Wide-leg silk pants',
        sizeChart: 'pants',
      },
      { slug: 'quan-phi-bong', name: 'Quần phi bóng', nameEn: 'Satin pants', sizeChart: 'pants' },
      { slug: 'quan-gam', name: 'Quần gấm', nameEn: 'Brocade pants', sizeChart: 'pants' },
    ],
  },
  {
    slug: 'phu-kien-ao-dai',
    ...PRODUCT_GROUP_NAMES.ACCESSORY,
    group: 'ACCESSORY',
    children: [
      { slug: 'man-doi', name: 'Mấn đội', nameEn: 'Headpieces' },
      { slug: 'kieng-co-ngoc-trai', name: 'Kiềng cổ / ngọc trai', nameEn: 'Necklaces & pearls' },
      { slug: 'tui-xach', name: 'Túi', nameEn: 'Bags' },
      { slug: 'quat-theu', name: 'Quạt thêu', nameEn: 'Embroidered fans' },
    ],
  },
  {
    // Guốc có bảng size cỡ chân riêng nên là một nhóm gốc, không nằm trong Phụ kiện
    slug: 'giay-guoc',
    ...PRODUCT_GROUP_NAMES.FOOTWEAR,
    group: 'FOOTWEAR',
    children: [{ slug: 'guoc-moc', name: 'Guốc mộc', nameEn: 'Wooden clogs', sizeChart: 'clogs' }],
  },
  {
    slug: 'nguyen-lieu',
    ...PRODUCT_GROUP_NAMES.MATERIAL,
    group: 'MATERIAL',
    children: [{ slug: 'vai-may-ao-dai', name: 'Vải may áo dài', nameEn: 'Ao dai fabric' }],
  },
]

type Range = [number, number]

interface SizeChartSeed {
  name: string
  nameEn: string
  group: ProductGroup
  description: string
  guide: string
  /** key → [validMin, validMax, bigsizeFrom | null] */
  columns: Record<string, [number, number, number | null]>
  rows: [string, Record<string, Range>][]
  surcharge?: { type: 'PERCENTAGE' | 'FIXED_AMOUNT'; value: number; extraFabric: number }
}

const GUIDE_AO_DAI =
  'Ngực: đo vòng qua điểm cao nhất của ngực, thước không siết.\n' +
  'Eo: áo dài chiết eo cao — đo chỗ nhỏ nhất, cao hơn rốn khoảng 2-3 cm.\n' +
  'Mông: đo vòng qua điểm nở nhất của mông.\n' +
  'Nách: đo vòng quanh bắp tay sát nách.\n' +
  'Dài tay: từ chân cổ qua đầu vai xuống tới cổ tay.'

const SIZE_CHARTS: Record<string, SizeChartSeed> = {
  traditional: {
    name: 'Áo dài truyền thống (form ôm)',
    nameEn: 'Traditional ao dai (fitted)',
    group: 'AO_DAI',
    description: 'Form ôm sát, khắt khe ở vòng ngực, eo chiết cao và vòng nách.',
    guide: GUIDE_AO_DAI,
    columns: {
      height: [120, 200, null],
      weight: [30, 150, null],
      bust: [60, 150, 98],
      waist: [50, 130, 84],
      hips: [60, 160, 106],
      armpit: [20, 60, null],
    },
    rows: [
      [
        'S',
        { height: [150, 158], weight: [40, 46], bust: [78, 82], waist: [60, 64], hips: [84, 88], armpit: [32, 34] },
      ],
      [
        'M',
        { height: [155, 162], weight: [46, 52], bust: [82, 86], waist: [64, 68], hips: [88, 92], armpit: [34, 36] },
      ],
      [
        'L',
        { height: [158, 165], weight: [52, 58], bust: [86, 90], waist: [68, 72], hips: [92, 96], armpit: [36, 38] },
      ],
      [
        'XL',
        { height: [160, 168], weight: [58, 64], bust: [90, 94], waist: [72, 76], hips: [96, 100], armpit: [38, 40] },
      ],
      [
        'XXL',
        { height: [160, 170], weight: [64, 70], bust: [94, 98], waist: [76, 80], hips: [100, 104], armpit: [40, 42] },
      ],
    ],
    surcharge: { type: 'FIXED_AMOUNT', value: 150_000, extraFabric: 0.8 },
  },
  modern: {
    name: 'Áo dài cách tân (form suông / A-line)',
    nameEn: 'Modern ao dai (loose / A-line)',
    group: 'AO_DAI',
    description: 'Không chiết eo, vòng eo rộng hơn form truyền thống 4-8 cm cho cùng một size.',
    guide: GUIDE_AO_DAI,
    columns: {
      height: [120, 200, null],
      weight: [30, 150, null],
      bust: [60, 150, 100],
      waist: [50, 140, 90],
      hips: [60, 160, 108],
    },
    rows: [
      ['S', { height: [150, 158], weight: [40, 47], bust: [78, 84], waist: [66, 70], hips: [84, 90] }],
      ['M', { height: [155, 162], weight: [47, 54], bust: [84, 88], waist: [70, 74], hips: [90, 94] }],
      ['L', { height: [158, 165], weight: [54, 60], bust: [88, 92], waist: [74, 78], hips: [94, 98] }],
      ['XL', { height: [160, 168], weight: [60, 66], bust: [92, 96], waist: [78, 82], hips: [98, 102] }],
      ['XXL', { height: [160, 170], weight: [66, 72], bust: [96, 100], waist: [82, 86], hips: [102, 106] }],
    ],
    surcharge: { type: 'FIXED_AMOUNT', value: 150_000, extraFabric: 0.8 },
  },
  matron: {
    name: 'Áo dài bà sui / trung niên',
    nameEn: 'Mother of the bride / mature fit',
    group: 'AO_DAI',
    description: 'Vòng bụng và bắp tay rộng hơn form thiếu nữ dù cùng chiều cao.',
    guide: GUIDE_AO_DAI,
    columns: {
      height: [130, 190, null],
      weight: [35, 160, null],
      bust: [70, 160, 110],
      waist: [55, 150, 102],
      hips: [70, 170, 116],
      upperArm: [18, 50, 36],
    },
    rows: [
      [
        'M',
        { height: [150, 160], weight: [48, 55], bust: [86, 90], waist: [72, 78], hips: [92, 96], upperArm: [26, 28] },
      ],
      [
        'L',
        { height: [152, 162], weight: [55, 62], bust: [90, 94], waist: [78, 84], hips: [96, 100], upperArm: [28, 30] },
      ],
      [
        'XL',
        { height: [152, 165], weight: [62, 69], bust: [94, 98], waist: [84, 90], hips: [100, 104], upperArm: [30, 32] },
      ],
      [
        'XXL',
        {
          height: [152, 165],
          weight: [69, 76],
          bust: [98, 104],
          waist: [90, 96],
          hips: [104, 110],
          upperArm: [32, 34],
        },
      ],
      [
        '3XL',
        {
          height: [152, 168],
          weight: [76, 84],
          bust: [104, 110],
          waist: [96, 102],
          hips: [110, 116],
          upperArm: [34, 36],
        },
      ],
    ],
    surcharge: { type: 'PERCENTAGE', value: 15, extraFabric: 1 },
  },
  men: {
    name: 'Áo dài nam (ngũ thân / cách tân)',
    nameEn: "Men's ao dai (five-panel / modern)",
    group: 'AO_DAI',
    description: 'Đo theo rộng vai, vòng ngực, chiều cao, cân nặng — không đo chiết eo như áo nữ.',
    guide:
      'Rộng vai: đo từ đầu vai trái sang đầu vai phải qua sau lưng.\nNgực: đo vòng qua nách và điểm nở nhất của ngực.',
    columns: { height: [140, 205, null], weight: [40, 160, null], shoulder: [34, 60, 52], bust: [70, 150, 106] },
    rows: [
      ['S', { height: [160, 166], weight: [50, 57], shoulder: [40, 42], bust: [84, 88] }],
      ['M', { height: [166, 171], weight: [57, 64], shoulder: [42, 44], bust: [88, 92] }],
      ['L', { height: [171, 176], weight: [64, 71], shoulder: [44, 46], bust: [92, 96] }],
      ['XL', { height: [176, 181], weight: [71, 78], shoulder: [46, 48], bust: [96, 100] }],
      ['XXL', { height: [178, 185], weight: [78, 86], shoulder: [48, 50], bust: [100, 106] }],
    ],
    surcharge: { type: 'FIXED_AMOUNT', value: 150_000, extraFabric: 0.8 },
  },
  kids: {
    name: 'Áo dài trẻ em',
    nameEn: "Kids' ao dai",
    group: 'AO_DAI',
    description: 'Chọn theo tuổi và cân nặng (1-12 tuổi, 10-38 kg); nếu bé cao hơn tuổi thì ưu tiên chiều cao.',
    guide: 'Cân nặng và chiều cao đo lúc bé mặc đồ mỏng, không mang giày.',
    columns: { age: [0, 14, null], weight: [8, 50, null], height: [70, 165, null] },
    rows: [
      ['1-2 tuổi', { age: [1, 2], weight: [10, 13], height: [75, 92] }],
      ['3-4 tuổi', { age: [3, 4], weight: [13, 17], height: [92, 108] }],
      ['5-6 tuổi', { age: [5, 6], weight: [17, 22], height: [108, 120] }],
      ['7-8 tuổi', { age: [7, 8], weight: [22, 27], height: [120, 132] }],
      ['9-10 tuổi', { age: [9, 10], weight: [27, 33], height: [132, 142] }],
      ['11-12 tuổi', { age: [11, 12], weight: [33, 38], height: [142, 152] }],
    ],
  },
  pants: {
    name: 'Quần áo dài (đồ lẻ)',
    nameEn: 'Ao dai pants (separates)',
    group: 'PANTS',
    description: 'Chỉ gồm vòng eo, vòng mông, dài quần và rộng ống.',
    guide: 'Eo quần: đo ngang rốn. Dài quần: từ eo xuống chấm gót khi đi giày cao gót bạn hay mang.',
    columns: { waist: [50, 140, 84], hips: [60, 160, 106], pantsLength: [80, 125, null], legOpening: [30, 80, null] },
    rows: [
      ['S', { waist: [60, 64], hips: [84, 88], pantsLength: [100, 104], legOpening: [48, 52] }],
      ['M', { waist: [64, 68], hips: [88, 92], pantsLength: [102, 106], legOpening: [50, 54] }],
      ['L', { waist: [68, 72], hips: [92, 96], pantsLength: [104, 108], legOpening: [52, 56] }],
      ['XL', { waist: [72, 76], hips: [96, 100], pantsLength: [104, 108], legOpening: [54, 58] }],
      ['XXL', { waist: [76, 80], hips: [100, 104], pantsLength: [106, 110], legOpening: [56, 60] }],
    ],
    surcharge: { type: 'FIXED_AMOUNT', value: 80_000, extraFabric: 0.5 },
  },
  clogs: {
    name: 'Guốc mộc',
    nameEn: 'Wooden clogs',
    group: 'FOOTWEAR',
    description: 'Chọn theo chiều dài bàn chân; chân bè nên lấy lớn hơn một cỡ.',
    guide: 'Đặt chân lên giấy, đánh dấu gót và đầu ngón dài nhất rồi đo khoảng cách.',
    columns: { footLength: [18, 30, null] },
    rows: [
      ['35', { footLength: [22, 22.5] }],
      ['36', { footLength: [22.5, 23] }],
      ['37', { footLength: [23, 23.5] }],
      ['38', { footLength: [23.5, 24] }],
      ['39', { footLength: [24, 24.5] }],
      ['40', { footLength: [24.5, 25] }],
    ],
  },
}

/** Tạo bảng size mẫu nếu chưa có (theo tên), trả về id theo mã nội bộ của seed */
async function seedSizeCharts(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {}

  for (const [code, chart] of Object.entries(SIZE_CHARTS)) {
    const existing = await prisma.sizeChart.findFirst({ where: { name: chart.name }, select: { id: true } })
    if (existing) {
      ids[code] = existing.id
      continue
    }

    const created = await prisma.sizeChart.create({
      data: {
        name: chart.name,
        nameEn: chart.nameEn,
        group: chart.group,
        description: chart.description,
        measurementGuide: chart.guide,
        bigsizeSurchargeType: chart.surcharge?.type ?? null,
        bigsizeSurchargeValue: chart.surcharge?.value ?? null,
        bigsizeExtraFabric: chart.surcharge?.extraFabric ?? null,
        columns: {
          create: Object.entries(chart.columns).map(([key, [validMin, validMax, bigsizeFrom]], position) => ({
            key,
            position,
            validMin,
            validMax,
            bigsizeFrom,
          })),
        },
        rows: {
          create: chart.rows.map(([sizeLabel, ranges], position) => ({
            sizeLabel,
            position,
            values: Object.fromEntries(
              Object.entries(ranges).map(([key, [min, max]]) => [key, { min, max }])
            ) as Prisma.InputJsonObject,
          })),
        },
      },
      select: { id: true },
    })
    ids[code] = created.id
  }

  console.log(`   📏 ${Object.keys(SIZE_CHARTS).length} bảng size mẫu`)
  return ids
}

async function upsertCategory(
  node: CategoryLeaf,
  group: ProductGroup,
  position: number,
  parentId: string | null,
  sizeChartIds: Record<string, string>
) {
  const sizeChartId = node.sizeChart ? sizeChartIds[node.sizeChart] : null
  const existing = await prisma.category.findUnique({
    where: { slug: node.slug },
    select: { id: true, parentId: true, defaultSizeChartId: true },
  })

  if (!existing) {
    const created = await prisma.category.create({
      data: {
        slug: node.slug,
        name: node.name,
        nameEn: node.nameEn,
        group,
        position,
        parentId,
        defaultSizeChartId: sizeChartId,
      },
      select: { id: true },
    })
    return created.id
  }

  // Loại cũ (trước khi có cây) đang nằm ở gốc → gắn vào nhóm cha theo cây mới; còn lại giữ nguyên chỉnh sửa của admin
  const isLegacyRoot = parentId !== null && existing.parentId === null
  await prisma.category.update({
    where: { id: existing.id },
    data: {
      ...(isLegacyRoot ? { parentId, position, group, name: node.name, nameEn: node.nameEn } : {}),
      ...(existing.defaultSizeChartId === null && sizeChartId ? { defaultSizeChartId: sizeChartId } : {}),
    },
  })
  return existing.id
}

/** Cây loại sản phẩm + bảng size mẫu; trả về id loại sản phẩm theo slug */
export async function seedTaxonomy(): Promise<Record<string, string>> {
  const sizeChartIds = await seedSizeCharts()
  const categoryIds: Record<string, string> = {}

  for (const [rootIndex, root] of CATEGORY_TREE.entries()) {
    const rootId = await upsertCategory(root, root.group, rootIndex, null, sizeChartIds)
    categoryIds[root.slug] = rootId
    for (const [childIndex, child] of (root.children ?? []).entries()) {
      categoryIds[child.slug] = await upsertCategory(child, root.group, childIndex, rootId, sizeChartIds)
    }
  }

  console.log(`   🗂️  ${Object.keys(categoryIds).length} loại sản phẩm (cây ${CATEGORY_TREE.length} nhóm gốc)`)
  return categoryIds
}
