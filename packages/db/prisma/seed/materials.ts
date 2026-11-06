import { prisma, type Season } from '../../src'

/**
 * Nhóm thuộc tính hệ thống (không xóa được) — khớp migration 20261108020000_attribute_groups_table.
 * COLOR, SIZE tạo biến thể SKU; các nhóm còn lại là đặc tính thiết kế. Admin thêm được nhóm đặc tính mới.
 */
const ATTRIBUTE_SYSTEM_GROUPS = [
  {
    code: 'COLOR',
    name: 'Màu sắc',
    nameEn: 'Colours',
    description: 'Màu của biến thể SKU. Gom theo họ màu để khách lọc trên cửa hàng.',
    descriptionEn: 'SKU variant colours, grouped into colour families for store filters.',
  },
  {
    code: 'SIZE',
    name: 'Kích thước',
    nameEn: 'Sizes',
    description: 'Ký hiệu size của biến thể SKU, xếp từ nhỏ đến lớn — khớp với hàng trong bảng size.',
    descriptionEn: 'SKU size labels from smallest to largest — matching size chart rows.',
  },
  {
    code: 'NECKLINE',
    name: 'Kiểu cổ áo',
    nameEn: 'Necklines',
    description: 'Cổ trụ, cổ thuyền, cổ tim... dùng để lọc và mô tả sản phẩm.',
    descriptionEn: 'Mandarin, boat, V-neck... used to filter and describe products.',
  },
  {
    code: 'SLEEVE',
    name: 'Kiểu tay áo',
    nameEn: 'Sleeves',
    description: 'Tay dài, tay lửng, tay raglan...',
    descriptionEn: 'Long, three-quarter, raglan...',
  },
  {
    code: 'PATTERN_TECHNIQUE',
    name: 'Kỹ thuật họa tiết',
    nameEn: 'Pattern techniques',
    description: 'Thêu tay, vẽ tay, đính kết, in, dệt hoa văn...',
    descriptionEn: 'Hand embroidery, hand painting, beading, print, woven motifs...',
  },
  {
    code: 'FLAP_LENGTH',
    name: 'Chiều dài tà',
    nameEn: 'Flap lengths',
    description: 'Tà ngắn qua gối, tà dài chấm gót, tà xẻ cao...',
    descriptionEn: 'Knee-length, ankle-length, high slit...',
  },
  {
    code: 'OCCASION',
    name: 'Dịp sử dụng',
    nameEn: 'Occasions',
    description: 'Cưới hỏi, lễ Tết, công sở, chụp ảnh...',
    descriptionEn: 'Weddings, Tết, office, photoshoots...',
  },
] as const

type AttributeGroupCode = (typeof ATTRIBUTE_SYSTEM_GROUPS)[number]['code']

type AttributeSeed = {
  code: string
  name: string
  nameEn: string
  description?: string
  descriptionEn?: string
  hex?: string
  family?: string
}

/** Thuộc tính chuẩn của tiệm — luôn tạo (cả production) vì form sản phẩm và bộ lọc dựa vào đây */
const ATTRIBUTES: Record<AttributeGroupCode, AttributeSeed[]> = {
  COLOR: [
    { code: 'HONG-SEN', name: 'Hồng Sen', nameEn: 'Lotus Pink', hex: '#E7A1B0', family: 'PINK' },
    { code: 'DO-NHUNG', name: 'Đỏ Nhung', nameEn: 'Velvet Red', hex: '#8B1E2D', family: 'RED' },
    { code: 'DO-SON', name: 'Đỏ Son', nameEn: 'Vermilion', hex: '#C0392B', family: 'RED' },
    { code: 'VANG-CUC', name: 'Vàng Cúc', nameEn: 'Marigold', hex: '#E9B949', family: 'YELLOW' },
    { code: 'XANH-NGOC', name: 'Xanh Ngọc', nameEn: 'Jade', hex: '#3E8E7E', family: 'GREEN' },
    { code: 'XANH-CHAM', name: 'Xanh Chàm', nameEn: 'Indigo', hex: '#2E3F6E', family: 'BLUE' },
    { code: 'TIM-MONG-TOI', name: 'Tím Mồng Tơi', nameEn: 'Malabar Purple', hex: '#5B2C6F', family: 'PURPLE' },
    { code: 'TRANG-NGA', name: 'Trắng Ngà', nameEn: 'Ivory', hex: '#F4EFE3', family: 'WHITE' },
    { code: 'DEN-TUYEN', name: 'Đen Tuyền', nameEn: 'Jet Black', hex: '#1C1C1E', family: 'BLACK' },
  ],
  SIZE: [
    { code: 'XS', name: 'XS', nameEn: 'XS', description: 'Ngực 76–80 cm', descriptionEn: 'Bust 76–80 cm' },
    { code: 'S', name: 'S', nameEn: 'S', description: 'Ngực 80–84 cm', descriptionEn: 'Bust 80–84 cm' },
    { code: 'M', name: 'M', nameEn: 'M', description: 'Ngực 84–88 cm', descriptionEn: 'Bust 84–88 cm' },
    { code: 'L', name: 'L', nameEn: 'L', description: 'Ngực 88–92 cm', descriptionEn: 'Bust 88–92 cm' },
    { code: 'XL', name: 'XL', nameEn: 'XL', description: 'Ngực 92–97 cm', descriptionEn: 'Bust 92–97 cm' },
    { code: 'XXL', name: 'XXL', nameEn: 'XXL', description: 'Ngực 97–102 cm', descriptionEn: 'Bust 97–102 cm' },
    { code: 'FREE_SIZE', name: 'Free size', nameEn: 'Free size', description: 'Phụ kiện một cỡ', descriptionEn: 'One-size accessories' },
  ],
  NECKLINE: [
    { code: 'CO-TRU', name: 'Cổ trụ', nameEn: 'Mandarin collar', description: 'Cổ đứng truyền thống, cao 3–5 cm', descriptionEn: 'Traditional stand collar, 3–5 cm' },
    { code: 'CO-THUYEN', name: 'Cổ thuyền', nameEn: 'Boat neck', description: 'Khoét rộng ngang vai, hợp áo dài cách tân', descriptionEn: 'Wide shoulder-to-shoulder neckline for modern áo dài' },
    { code: 'CO-TIM', name: 'Cổ tim', nameEn: 'V-neck', description: 'Khoét chữ V, giúp cổ trông dài hơn', descriptionEn: 'V-shaped, lengthens the neck' },
    { code: 'CO-YEM', name: 'Cổ yếm', nameEn: 'Halter neck', description: 'Lấy cảm hứng từ áo yếm', descriptionEn: 'Inspired by the yếm bodice' },
  ],
  SLEEVE: [
    { code: 'TAY-DAI', name: 'Tay dài', nameEn: 'Long sleeve', description: 'Dài chấm cổ tay', descriptionEn: 'Wrist length' },
    { code: 'TAY-LUNG', name: 'Tay lửng', nameEn: 'Three-quarter sleeve', description: 'Dài qua khuỷu tay', descriptionEn: 'Below the elbow' },
    { code: 'TAY-RAGLAN', name: 'Tay raglan', nameEn: 'Raglan sleeve', description: 'Đường ráp chéo từ nách lên cổ, cử động thoải mái', descriptionEn: 'Diagonal seam from underarm to collar, easy movement' },
    { code: 'TAY-LOE', name: 'Tay loe', nameEn: 'Bell sleeve', description: 'Loe nhẹ ở cổ tay', descriptionEn: 'Gently flared at the wrist' },
  ],
  PATTERN_TECHNIQUE: [
    { code: 'THEU-TAY', name: 'Thêu tay', nameEn: 'Hand embroidery' },
    { code: 'VE-TAY', name: 'Vẽ tay', nameEn: 'Hand painting' },
    { code: 'DINH-KET', name: 'Đính kết', nameEn: 'Beading' },
    { code: 'DET-HOA-VAN', name: 'Dệt hoa văn', nameEn: 'Woven motif', description: 'Hoa văn dệt sẵn trên vải (gấm, thổ cẩm)', descriptionEn: 'Motif woven into the cloth (brocade, ethnic weave)' },
    { code: 'IN-KY-THUAT-SO', name: 'In kỹ thuật số', nameEn: 'Digital print' },
    { code: 'TRON', name: 'Trơn', nameEn: 'Plain' },
  ],
  FLAP_LENGTH: [
    { code: 'TA-NGAN', name: 'Tà ngắn', nameEn: 'Short flap', description: 'Ngang hoặc qua gối', descriptionEn: 'At or just below the knee' },
    { code: 'TA-BAP-CHAN', name: 'Tà bắp chân', nameEn: 'Mid-calf flap', description: 'Dài tới giữa bắp chân', descriptionEn: 'Reaches mid-calf' },
    { code: 'TA-DAI', name: 'Tà dài', nameEn: 'Long flap', description: 'Chấm gót, kiểu truyền thống', descriptionEn: 'Ankle length, traditional style' },
  ],
  OCCASION: [
    { code: 'CUOI-HOI', name: 'Cưới hỏi', nameEn: 'Wedding' },
    { code: 'LE-TET', name: 'Lễ, Tết', nameEn: 'Festivals & Tết' },
    { code: 'CONG-SO', name: 'Công sở', nameEn: 'Office' },
    { code: 'CHUP-ANH', name: 'Chụp ảnh', nameEn: 'Photoshoot' },
    { code: 'TOT-NGHIEP', name: 'Tốt nghiệp', nameEn: 'Graduation' },
  ],
}

type MaterialSeed = {
  code: string
  name: string
  nameEn: string
  origin: string
  originEn: string
  description: string
  descriptionEn: string
  composition: { fiber: string; percent: number }[]
  processSteps: { title: string; titleEn: string; detail: string; detailEn: string }[]
  metrics: { stretch: number; thickness: number; drape: number; sheerness: number; sheen: number }
  seasons: Season[]
  careCodes: string[]
  widthCm: number
  metersPerTop: number
  metersPerPants: number
}

/** Chất liệu mẫu (chỉ khi bật demo) — mã khớp với cây vải demo ở operations.ts */
export const DEMO_MATERIALS: MaterialSeed[] = [
  {
    code: 'LUA-TO-TAM',
    name: 'Lụa tơ tằm',
    nameEn: 'Mulberry silk',
    origin: 'Bảo Lộc, Lâm Đồng',
    originEn: 'Bao Loc, Lam Dong',
    description: 'Mặt lụa mịn, mát, bắt sáng nhẹ; rủ theo dáng người khi bước.',
    descriptionEn: 'Smooth, cool silk with a soft sheen that follows the body as you walk.',
    composition: [{ fiber: 'SILK', percent: 100 }],
    processSteps: [
      { title: 'Trồng dâu, nuôi tằm', titleEn: 'Mulberry & silkworms', detail: 'Tằm ăn lá dâu khoảng 25 ngày rồi nhả tơ làm kén.', detailEn: 'Silkworms feed on mulberry for about 25 days, then spin cocoons.' },
      { title: 'Ươm tơ', titleEn: 'Reeling', detail: 'Luộc kén, gỡ đầu sợi và quay thành cuộn tơ.', detailEn: 'Cocoons are boiled and the filaments reeled into skeins.' },
      { title: 'Dệt', titleEn: 'Weaving', detail: 'Dệt trơn trên khung, khổ 90 cm.', detailEn: 'Plain-woven on the loom at 90 cm width.' },
      { title: 'Nhuộm', titleEn: 'Dyeing', detail: 'Nhuộm từng mẻ nhỏ để giữ màu đều.', detailEn: 'Dyed in small batches for even colour.' },
    ],
    metrics: { stretch: 1, thickness: 2, drape: 5, sheerness: 2, sheen: 4 },
    seasons: ['SPRING', 'SUMMER', 'AUTUMN'],
    careCodes: ['HAND_WASH', 'COLD_WATER', 'NO_BLEACH', 'NO_WRING', 'DRY_SHADE', 'IRON_LOW', 'STORE_HANGING'],
    widthCm: 90,
    metersPerTop: 2.2,
    metersPerPants: 1.8,
  },
  {
    code: 'GAM-RUBY',
    name: 'Gấm ruby',
    nameEn: 'Ruby brocade',
    origin: 'Vạn Phúc, Hà Nội',
    originEn: 'Van Phuc, Hanoi',
    description: 'Gấm dệt hoa văn chìm, đứng phom, hợp áo dài cưới và lễ.',
    descriptionEn: 'Brocade with a tone-on-tone woven motif; holds its shape for wedding and ceremonial áo dài.',
    composition: [{ fiber: 'SILK', percent: 60 }, { fiber: 'POLYESTER', percent: 40 }],
    processSteps: [
      { title: 'Lên go hoa văn', titleEn: 'Pattern set-up', detail: 'Thợ cài go theo mẫu hoa văn trên khung Jacquard.', detailEn: 'The pattern is set on a Jacquard loom.' },
      { title: 'Dệt gấm', titleEn: 'Brocade weaving', detail: 'Dệt hai lớp sợi để nổi hoa văn.', detailEn: 'Two yarn layers are woven to raise the motif.' },
    ],
    metrics: { stretch: 1, thickness: 4, drape: 2, sheerness: 1, sheen: 5 },
    seasons: ['AUTUMN', 'WINTER'],
    careCodes: ['DRY_CLEAN', 'NO_BLEACH', 'IRON_LOW', 'STORE_HANGING'],
    widthCm: 110,
    metersPerTop: 2,
    metersPerPants: 1.6,
  },
  {
    code: 'LINEN-THO',
    name: 'Linen thô',
    nameEn: 'Raw linen',
    origin: 'Nhập khẩu',
    originEn: 'Imported',
    description: 'Thoáng, thấm hút, có độ nhăn tự nhiên; hợp áo dài công sở mùa hè.',
    descriptionEn: 'Breathable and absorbent with natural creasing; ideal for summer office áo dài.',
    composition: [{ fiber: 'LINEN', percent: 70 }, { fiber: 'COTTON', percent: 30 }],
    processSteps: [],
    metrics: { stretch: 1, thickness: 3, drape: 2, sheerness: 1, sheen: 1 },
    seasons: ['SPRING', 'SUMMER'],
    careCodes: ['MACHINE_GENTLE', 'COLD_WATER', 'DRY_SHADE', 'STEAM'],
    widthCm: 140,
    metersPerTop: 1.8,
    metersPerPants: 1.4,
  },
  {
    code: 'VOAN-LUA',
    name: 'Voan lụa',
    nameEn: 'Silk chiffon',
    origin: 'Hàng Châu',
    originEn: 'Hangzhou',
    description: 'Mỏng nhẹ, xuyên thấu; thường may lớp ngoài phối lót.',
    descriptionEn: 'Light and sheer; usually layered over a lining.',
    composition: [{ fiber: 'SILK', percent: 30 }, { fiber: 'POLYESTER', percent: 70 }],
    processSteps: [],
    metrics: { stretch: 2, thickness: 1, drape: 4, sheerness: 5, sheen: 2 },
    seasons: ['SUMMER'],
    careCodes: ['HAND_WASH', 'COLD_WATER', 'NO_WRING', 'IRON_LOW'],
    widthCm: 150,
    metersPerTop: 2.4,
    metersPerPants: 1.6,
  },
]

/** Nhóm hệ thống + thuộc tính chuẩn: tạo nếu chưa có (không ghi đè chỉnh sửa của admin) */
export async function seedAttributes() {
  let count = 0
  for (const [position, group] of ATTRIBUTE_SYSTEM_GROUPS.entries()) {
    const saved = await prisma.attributeGroup.upsert({
      where: { code: group.code },
      update: { isSystem: true },
      create: { ...group, isSystem: true, position },
      select: { id: true },
    })
    for (const [valuePosition, value] of ATTRIBUTES[group.code].entries()) {
      await prisma.attributeValue.upsert({
        where: { groupId_code: { groupId: saved.id, code: value.code } },
        update: {},
        create: { groupId: saved.id, position: valuePosition, ...value },
      })
      count++
    }
  }
  console.log(`   🏷️  ${count} giá trị thuộc tính`)
}

/** Chất liệu demo (upsert theo mã) — trả map mã → id để gắn cây vải */
export async function seedMaterials(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {}
  for (const [position, { metrics, ...material }] of DEMO_MATERIALS.entries()) {
    const data = { ...material, ...metrics, position }
    const saved = await prisma.material.upsert({
      where: { code: material.code },
      update: data,
      create: data,
      select: { id: true },
    })
    ids[material.code] = saved.id
  }
  console.log(`   🧵 ${DEMO_MATERIALS.length} chất liệu vải`)
  return ids
}
