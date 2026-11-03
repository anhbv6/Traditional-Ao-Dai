/**
 * Nghiệp vụ size dùng chung FE ↔ BE: đặc tính nhóm hàng, danh mục thông số đo, kiểm tra số đo khách nhập,
 * nhận diện bigsize và gợi ý size từ Bảng size mẫu (dữ liệu số, không phải ảnh).
 * Server luôn tính lại phụ phí bigsize — kết quả ở client chỉ để hiển thị.
 */

export const PRODUCT_GROUPS = ['AO_DAI', 'PANTS', 'ACCESSORY', 'FOOTWEAR', 'MATERIAL'] as const
export type ProductGroup = (typeof PRODUCT_GROUPS)[number]

export const MEASUREMENT_KEYS = [
  'height',
  'weight',
  'age',
  'bust',
  'waist',
  'hips',
  'shoulder',
  'armpit',
  'upperArm',
  'armLength',
  'shirtLength',
  'neck',
  'thigh',
  'pantsLength',
  'legOpening',
  'footLength',
] as const
export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number]

export type MeasurementUnit = 'cm' | 'kg' | 'year'

export const MEASUREMENT_UNITS: Record<MeasurementKey, MeasurementUnit> = {
  height: 'cm',
  weight: 'kg',
  age: 'year',
  bust: 'cm',
  waist: 'cm',
  hips: 'cm',
  shoulder: 'cm',
  armpit: 'cm',
  upperArm: 'cm',
  armLength: 'cm',
  shirtLength: 'cm',
  neck: 'cm',
  thigh: 'cm',
  pantsLength: 'cm',
  legOpening: 'cm',
  footLength: 'cm',
}

/** Bộ đo nhanh 3 vòng — khách không có số đo đầy đủ vẫn ghép được bộ áo dài */
export const THREE_POINT_KEYS = ['bust', 'waist', 'hips'] as const satisfies readonly MeasurementKey[]

export interface ProductGroupTraits {
  /** Bộ số đo khi may đo: FULL (áo dài), PANTS (chỉ phần quần), null = không nhận may đo */
  customMeasurement: 'FULL' | 'PANTS' | null
  /** Cho phép ghép bộ bằng 3 vòng (ngực - eo - mông) thay cho số đo đầy đủ */
  threePointSet: boolean
  /** Đơn vị bán: theo cái hay theo mét vải */
  sellUnit: 'PIECE' | 'METER'
  /** Cách chọn size: theo cơ thể (bảng size), theo chân (cỡ giày), hoặc không có size */
  sizing: 'BODY' | 'FOOT' | 'NONE'
  /** Thông số gợi ý khi tạo bảng size cho nhóm này */
  suggestedKeys: readonly MeasurementKey[]
}

/** Bản chất từng nhóm hàng — nguồn duy nhất cho form sản phẩm, bảng size, storefront và giỏ hàng */
export const PRODUCT_GROUP_TRAITS: Record<ProductGroup, ProductGroupTraits> = {
  AO_DAI: {
    customMeasurement: 'FULL',
    threePointSet: true,
    sellUnit: 'PIECE',
    sizing: 'BODY',
    suggestedKeys: [
      'height',
      'weight',
      'bust',
      'waist',
      'hips',
      'armpit',
      'shoulder',
      'upperArm',
      'armLength',
      'shirtLength',
    ],
  },
  PANTS: {
    customMeasurement: 'PANTS',
    threePointSet: false,
    sellUnit: 'PIECE',
    sizing: 'BODY',
    suggestedKeys: ['waist', 'hips', 'thigh', 'pantsLength', 'legOpening'],
  },
  ACCESSORY: { customMeasurement: null, threePointSet: false, sellUnit: 'PIECE', sizing: 'NONE', suggestedKeys: [] },
  FOOTWEAR: {
    customMeasurement: null,
    threePointSet: false,
    sellUnit: 'PIECE',
    sizing: 'FOOT',
    suggestedKeys: ['footLength'],
  },
  MATERIAL: { customMeasurement: null, threePointSet: false, sellUnit: 'METER', sizing: 'NONE', suggestedKeys: [] },
}

export interface SizeRange {
  min: number | null
  max: number | null
}

export interface SizeChartColumnData {
  key: MeasurementKey
  validMin: number | null
  validMax: number | null
  bigsizeFrom: number | null
}

export interface SizeChartRowData {
  sizeLabel: string
  values: Partial<Record<MeasurementKey, SizeRange>>
}

export interface SizeChartData {
  columns: SizeChartColumnData[]
  rows: SizeChartRowData[]
}

export type MeasurementInput = Partial<Record<MeasurementKey, number | null | undefined>>

/** Kiểm tra mã thông số (dữ liệu JSON/form có thể chứa chuỗi tùy ý) */
export function isMeasurementKey(value: string): value is MeasurementKey {
  return (MEASUREMENT_KEYS as readonly string[]).includes(value)
}

const filled = (input: MeasurementInput) =>
  MEASUREMENT_KEYS.flatMap((key) => {
    const value = input[key]
    return typeof value === 'number' && Number.isFinite(value) ? [[key, value] as const] : []
  })

export interface MeasurementIssue {
  key: MeasurementKey
  reason: 'BELOW_MIN' | 'ABOVE_MAX'
  limit: number
}

/**
 * Số đo nằm ngoài ngưỡng hợp lệ của bảng size — bắt lỗi gõ nhầm đơn vị (650 thay vì 65) ngay trên form.
 */
export function validateMeasurements(
  chart: Pick<SizeChartData, 'columns'>,
  input: MeasurementInput
): MeasurementIssue[] {
  const values = new Map(filled(input))
  return chart.columns.flatMap<MeasurementIssue>((column) => {
    const value = values.get(column.key)
    if (value === undefined) return []
    if (column.validMin !== null && value < column.validMin)
      return [{ key: column.key, reason: 'BELOW_MIN', limit: column.validMin }]
    if (column.validMax !== null && value > column.validMax)
      return [{ key: column.key, reason: 'ABOVE_MAX', limit: column.validMax }]
    return []
  })
}

/** Các thông số vượt ngưỡng bigsize (chỉ cần MỘT cột vượt là đơn bigsize) */
export function detectBigsize(chart: Pick<SizeChartData, 'columns'>, input: MeasurementInput): MeasurementKey[] {
  const values = new Map(filled(input))
  return chart.columns.flatMap((column) => {
    const value = values.get(column.key)
    return column.bigsizeFrom !== null && value !== undefined && value > column.bigsizeFrom ? [column.key] : []
  })
}

export interface SizeSuggestion {
  /**
   * FIT: vừa một size · TIGHT: vừa nhưng có vòng sát (nên chọn vải co giãn / size lớn hơn / may đo)
   * · NO_FIT: không size nào vừa (nên may đo) · INSUFFICIENT: thiếu số đo để so
   */
  status: 'FIT' | 'TIGHT' | 'NO_FIT' | 'INSUFFICIENT'
  sizeLabel: string | null
  /** Vòng chạm sát hoặc nhỉnh hơn mức tối đa của size được gợi ý */
  tightKeys: MeasurementKey[]
  /** Vòng nhỏ hơn mức tối thiểu (áo sẽ rộng ở chỗ đó) */
  looseKeys: MeasurementKey[]
  /** Size lớn hơn kế tiếp, gợi ý khi đang sát */
  nextSizeLabel: string | null
  /** Nên chuyển sang may đo (không vừa size nào hoặc vượt bigsize) */
  recommendCustom: boolean
  bigsizeKeys: MeasurementKey[]
}

// Cao/nặng/tuổi chỉ là tham khảo, vòng cơ thể mới quyết định áo có mặc vừa không
const SOFT_KEYS: readonly MeasurementKey[] = ['height', 'weight', 'age']
// Chạm sát mức tối đa trong khoảng này (cm) thì coi là "hơi sát"
const TIGHT_MARGIN = 1
// Vượt mức tối đa quá khoảng này ở một vòng cơ thể thì size đó không mặc được
const HARD_OVERFLOW = 2

/**
 * Gợi ý size từ bảng size mẫu. Chấm điểm từng size theo độ lệch khỏi khoảng [min, max] của mỗi thông số
 * (vòng cơ thể tính đủ, cao/nặng tính một nửa), chọn size lệch ít nhất rồi đánh giá độ vừa.
 */
export function suggestSize(chart: SizeChartData, input: MeasurementInput): SizeSuggestion {
  const values = filled(input)
  const bigsizeKeys = detectBigsize(chart, input)
  const empty: SizeSuggestion = {
    status: 'INSUFFICIENT',
    sizeLabel: null,
    tightKeys: [],
    looseKeys: [],
    nextSizeLabel: null,
    recommendCustom: bigsizeKeys.length > 0,
    bigsizeKeys,
  }
  if (values.length === 0 || chart.rows.length === 0) return empty

  const scored = chart.rows.map((row, index) => {
    let score = 0
    let compared = 0
    let hardMiss = false
    const tightKeys: MeasurementKey[] = []
    const looseKeys: MeasurementKey[] = []

    for (const [key, value] of values) {
      const range = row.values[key]
      if (!range || (range.min === null && range.max === null)) continue
      compared++
      const weight = SOFT_KEYS.includes(key) ? 0.5 : 1
      const width = Math.max(1, (range.max ?? value) - (range.min ?? value))

      if (range.max !== null && value > range.max) {
        score += ((value - range.max) / width) * weight
        if (!SOFT_KEYS.includes(key)) {
          tightKeys.push(key)
          if (value - range.max > HARD_OVERFLOW) hardMiss = true
        }
      } else if (range.min !== null && value < range.min) {
        score += ((range.min - value) / width) * weight
        if (!SOFT_KEYS.includes(key)) looseKeys.push(key)
      } else if (range.max !== null && !SOFT_KEYS.includes(key) && range.max - value < TIGHT_MARGIN) {
        tightKeys.push(key)
      }
    }
    return { row, index, score, compared, hardMiss, tightKeys, looseKeys }
  })

  const comparable = scored.filter((s) => s.compared > 0)
  if (comparable.length === 0) return empty

  const best = comparable.reduce((a, b) => (b.score < a.score ? b : a))
  const next = chart.rows[best.index + 1]?.sizeLabel ?? null

  if (best.hardMiss || bigsizeKeys.length > 0) {
    return {
      ...empty,
      status: 'NO_FIT',
      sizeLabel: best.row.sizeLabel,
      tightKeys: best.tightKeys,
      looseKeys: best.looseKeys,
      nextSizeLabel: next,
      recommendCustom: true,
    }
  }

  return {
    status: best.tightKeys.length > 0 ? 'TIGHT' : 'FIT',
    sizeLabel: best.row.sizeLabel,
    tightKeys: best.tightKeys,
    looseKeys: best.looseKeys,
    nextSizeLabel: best.tightKeys.length > 0 ? next : null,
    recommendCustom: false,
    bigsizeKeys,
  }
}
