/**
 * Bảng tuỳ chọn & báo giá áo dài thiết kế riêng (trang /custom) — dùng chung FE ↔ BE:
 * web hiển thị báo giá tạm tính, API tính lại đúng công thức này khi đặt hàng (không tin giá từ client).
 * Tên & mô tả hiển thị dịch ở web qua `BespokePage.options.<nhóm>.<id>`. Tiền: số nguyên VND.
 *
 * NGHIỆP VỤ:
 * - Giá = giá gốc theo KIỂU DÁNG + phụ phí CHẤT LIỆU + TRANG TRÍ + QUẦN / CHÂN VÁY; may gấp +30%.
 * - Thời gian = 7 ngày nền + ngày cộng thêm của kiểu dáng / trang trí (thêu tay lâu nhất); may gấp rút còn ~5 ngày.
 */

/** Sản phẩm (saleMode CUSTOM) mà mọi đơn thiết kế riêng gắn vào — tạo bằng seed */
export const BESPOKE_PRODUCT_SLUG = 'ao-dai-thiet-ke-rieng'

export const OCCASIONS = ['wedding', 'tet', 'graduation', 'gala', 'daily'] as const
export type Occasion = (typeof OCCASIONS)[number]

export const STYLES = [
  { id: 'traditional', basePrice: 1_800_000, extraDays: 0 },
  { id: 'modern', basePrice: 1_500_000, extraDays: 0 },
  { id: 'loose', basePrice: 1_400_000, extraDays: 0 },
  { id: 'fivePanel', basePrice: 2_200_000, extraDays: 2 },
] as const
export type StyleId = (typeof STYLES)[number]['id']

export const FABRICS = [
  { id: 'chiffon', surcharge: 0 },
  { id: 'satin', surcharge: 300_000 },
  { id: 'silk', surcharge: 900_000 },
  { id: 'velvet', surcharge: 800_000 },
  { id: 'brocade', surcharge: 1_200_000 },
] as const
export type FabricId = (typeof FABRICS)[number]['id']

/** Bảng màu vải — mã màu dùng cho ô màu và hình xem trước */
export const COLORS = [
  { id: 'burgundy', hex: '#800020' },
  { id: 'vermilion', hex: '#B32530' },
  { id: 'ochre', hex: '#C99A2E' },
  { id: 'blush', hex: '#E7B3B0' },
  { id: 'ivory', hex: '#F3EBDD' },
  { id: 'jade', hex: '#3E8E7E' },
  { id: 'indigo', hex: '#2E3F7F' },
  { id: 'black', hex: '#1F1A1B' },
] as const
export type ColorId = (typeof COLORS)[number]['id']

export const COLLARS = ['high', 'low', 'boat', 'sweetheart'] as const
export type CollarId = (typeof COLLARS)[number]

export const SLEEVES = ['long', 'threeQuarter', 'short'] as const
export type SleeveId = (typeof SLEEVES)[number]

export const LENGTHS = ['ankle', 'midCalf', 'knee'] as const
export type LengthId = (typeof LENGTHS)[number]

export const DECORATIONS = [
  { id: 'plain', surcharge: 0, extraDays: 0 },
  { id: 'print', surcharge: 300_000, extraDays: 1 },
  { id: 'embroidery', surcharge: 1_500_000, extraDays: 5 },
  { id: 'beading', surcharge: 900_000, extraDays: 3 },
] as const
export type DecorationId = (typeof DECORATIONS)[number]['id']

/** Hoạ tiết thêu (chỉ khi chọn thêu tay) */
export const MOTIFS = ['lotus', 'apricot', 'peach', 'phoenix'] as const
export type MotifId = (typeof MOTIFS)[number]

export const PANTS = [
  { id: 'silk', surcharge: 350_000 },
  { id: 'wide', surcharge: 400_000 },
  { id: 'skirt', surcharge: 450_000 },
  { id: 'none', surcharge: 0 },
] as const
export type PantsId = (typeof PANTS)[number]['id']

/** Cách lấy số đo: size chuẩn · tự nhập số đo · hẹn đo tại tiệm */
export const MEASURE_MODES = ['standard', 'custom', 'studio'] as const
export type MeasureMode = (typeof MEASURE_MODES)[number]

export const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const
export type StandardSize = (typeof STANDARD_SIZES)[number]

/** Số đo cần cho áo dài (cm) — khoảng hợp lệ để chặn gõ nhầm */
export const MEASUREMENT_FIELDS = [
  { id: 'height', min: 130, max: 200 },
  { id: 'bust', min: 60, max: 140 },
  { id: 'waist', min: 45, max: 130 },
  { id: 'hip', min: 60, max: 150 },
  { id: 'shoulder', min: 28, max: 55 },
  { id: 'sleeveLength', min: 15, max: 75 },
  { id: 'armhole', min: 25, max: 60 },
  { id: 'dressLength', min: 80, max: 160 },
] as const
export type MeasurementId = (typeof MEASUREMENT_FIELDS)[number]['id']

export const TIMELINES = ['standard', 'rush'] as const
export type Timeline = (typeof TIMELINES)[number]

/** Phụ phí may gấp (theo tỉ lệ tiền áo) */
export const RUSH_RATE = 0.3
/** Số ngày may nền (đã gồm thử áo & chỉnh sửa) */
export const BASE_DAYS = 7
/** May gấp: số ngày cố định */
export const RUSH_DAYS = 5

export interface BespokeConfig {
  occasion: Occasion
  style: StyleId
  fabric: FabricId
  color: ColorId
  collar: CollarId
  sleeve: SleeveId
  length: LengthId
  decoration: DecorationId
  motif: MotifId
  pants: PantsId
  measureMode: MeasureMode
  size: StandardSize
  timeline: Timeline
}

/** Số đo của form thiết kế riêng → khóa số đo lưu trên đơn (OrderItem) */
export const BESPOKE_MEASUREMENT_TO_ORDER_KEY = {
  height: 'height',
  bust: 'bust',
  waist: 'waist',
  hip: 'hips',
  shoulder: 'shoulder',
  sleeveLength: 'armLength',
  armhole: 'armpit',
  dressLength: 'shirtLength',
} as const satisfies Record<MeasurementId, string>

export interface BespokeQuote {
  basePrice: number
  fabricSurcharge: number
  decorationSurcharge: number
  pantsSurcharge: number
  rushFee: number
  total: number
  /** Khoảng ngày hoàn thiện (đã gồm thử & chỉnh) */
  minDays: number
  maxDays: number
}

const findById = <T extends { id: string }>(list: readonly T[], id: string): T => list.find((item) => item.id === id) ?? list[0]

/** Báo giá thiết kế riêng — hàm thuần, web và API dùng chung */
export function quoteBespoke(config: Pick<BespokeConfig, 'style' | 'fabric' | 'decoration' | 'pants' | 'timeline'>): BespokeQuote {
  const style = findById(STYLES, config.style)
  const fabric = findById(FABRICS, config.fabric)
  const decoration = findById(DECORATIONS, config.decoration)
  const pants = findById(PANTS, config.pants)

  const subtotal = style.basePrice + fabric.surcharge + decoration.surcharge + pants.surcharge
  const rushFee = config.timeline === 'rush' ? Math.round((subtotal * RUSH_RATE) / 1000) * 1000 : 0
  const minDays = config.timeline === 'rush' ? RUSH_DAYS : BASE_DAYS + style.extraDays + decoration.extraDays

  return {
    basePrice: style.basePrice,
    fabricSurcharge: fabric.surcharge,
    decorationSurcharge: decoration.surcharge,
    pantsSurcharge: pants.surcharge,
    rushFee,
    total: subtotal + rushFee,
    minDays,
    maxDays: config.timeline === 'rush' ? RUSH_DAYS + 1 : minDays + 3,
  }
}
