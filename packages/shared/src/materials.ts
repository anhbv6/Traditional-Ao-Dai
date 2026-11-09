/**
 * Hợp đồng chất liệu vải dùng chung admin (Prisma trực tiếp) ↔ Express (thư mục vải storefront).
 * Chỉ code thuần — tên hiển thị dịch theo mã ở phía web.
 */

/** Sợi dệt dùng trong thành phần vải */
export const FIBERS = [
  'SILK',
  'COTTON',
  'LINEN',
  'HEMP',
  'BAMBOO',
  'VISCOSE',
  'POLYESTER',
  'SPANDEX',
  'NYLON',
  'WOOL',
  'OTHER',
] as const
export type Fiber = (typeof FIBERS)[number]

/** Năm thanh đo vật lý chuẩn hóa 1–5 (thứ tự hiển thị cố định) */
export const MATERIAL_METRICS = ['stretch', 'thickness', 'drape', 'sheerness', 'sheen'] as const
export type MaterialMetric = (typeof MATERIAL_METRICS)[number]
export const METRIC_LEVELS = [1, 2, 3, 4, 5] as const
export type MaterialMetrics = Record<MaterialMetric, number | null>

export const SEASONS = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'] as const
export type Season = (typeof SEASONS)[number]

/** Ký hiệu bảo quản — mã lưu ở DB */
export const CARE_CODES = [
  'HAND_WASH',
  'MACHINE_GENTLE',
  'COLD_WATER',
  'NO_BLEACH',
  'NO_WRING',
  'DRY_SHADE',
  'IRON_LOW',
  'STEAM',
  'DRY_CLEAN',
  'STORE_HANGING',
] as const
export type CareCode = (typeof CARE_CODES)[number]

export type CompositionItem = { fiber: Fiber; percent: number }

export function isFiber(value: unknown): value is Fiber {
  return typeof value === 'string' && (FIBERS as readonly string[]).includes(value)
}

export function isSeason(value: unknown): value is Season {
  return typeof value === 'string' && (SEASONS as readonly string[]).includes(value)
}

export function isCareCode(value: unknown): value is CareCode {
  return typeof value === 'string' && (CARE_CODES as readonly string[]).includes(value)
}

/**
 * Số thân áo còn may được từ các cây vải: tính TỪNG cây (vải khác cây khác màu/lô không ghép chung một thân áo).
 * Chưa có định mức thì trả null.
 */
export function topsFromRolls(rolls: { remainingMeters: number }[], metersPerTop: number | null): number | null {
  if (!metersPerTop || metersPerTop <= 0) return null
  return rolls.reduce((sum, roll) => sum + Math.floor(roll.remainingMeters / metersPerTop), 0)
}

// ─── Thư mục vải storefront ────────────────────────────────────────────────────

/**
 * Tình trạng vải công khai cho khách — KHÔNG lộ số mét tồn kho thật.
 * - AVAILABLE: còn đủ may nhiều áo · LIMITED: chỉ còn vài áo · ON_REQUEST: hết vải sẵn, tiệm đặt dệt theo yêu cầu
 */
export const MATERIAL_AVAILABILITIES = ['AVAILABLE', 'LIMITED', 'ON_REQUEST'] as const
export type MaterialAvailability = (typeof MATERIAL_AVAILABILITIES)[number]

/** Còn may được tối đa bấy nhiêu thân áo thì coi là "sắp hết" */
export const MATERIAL_LIMITED_TOPS = 3

/** Quy tình trạng công khai từ tồn kho (chưa có định mức thì chỉ xét còn cây vải hay không) */
export function resolveMaterialAvailability(rollCount: number, tops: number | null): MaterialAvailability {
  if (tops === null) return rollCount > 0 ? 'AVAILABLE' : 'ON_REQUEST'
  if (tops <= 0) return 'ON_REQUEST'
  return tops <= MATERIAL_LIMITED_TOPS ? 'LIMITED' : 'AVAILABLE'
}

/** Màu cây vải đang có trong kho (tên màu đã lưu ở cây vải) */
export type MaterialSwatchDto = { name: string }

/** Một chất liệu trong thư mục vải — nội dung đã chọn theo ngôn ngữ yêu cầu */
export type PublicMaterialDto = {
  code: string
  name: string
  origin: string | null
  description: string | null
  composition: CompositionItem[]
  processSteps: { title: string; detail: string }[]
  closeupImages: string[]
  videoUrl: string | null
  metrics: MaterialMetrics
  seasons: Season[]
  careCodes: CareCode[]
  careNote: string | null
  widthCm: number | null
  availability: MaterialAvailability
  /** Các màu đang có sẵn (không trùng) */
  colors: string[]
}
