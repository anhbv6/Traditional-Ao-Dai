/**
 * Dữ liệu tuỳ chọn may áo dài theo yêu cầu (mock — khi có API, Backend trả bảng giá / thời gian).
 * Tên & mô tả hiển thị dịch qua `BespokePage.options.<nhóm>.<id>`. Tiền: số nguyên VND.
 *
 * NGHIỆP VỤ:
 * - Giá = giá gốc theo KIỂU DÁNG + phụ phí CHẤT LIỆU + TRANG TRÍ + QUẦN / CHÂN VÁY; may gấp +30%.
 * - Thời gian = 7 ngày nền + ngày cộng thêm của kiểu dáng / trang trí (thêu tay lâu nhất); may gấp rút còn ~5 ngày.
 * - Chọn DỊP MẶC → gợi ý sẵn bộ tuỳ chọn hợp dịp (khách vẫn đổi được từng mục).
 */

export const OCCASIONS = ["wedding", "tet", "graduation", "gala", "daily"] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const STYLES = [
  { id: "traditional", basePrice: 1_800_000, extraDays: 0 },
  { id: "modern", basePrice: 1_500_000, extraDays: 0 },
  { id: "loose", basePrice: 1_400_000, extraDays: 0 },
  { id: "fivePanel", basePrice: 2_200_000, extraDays: 2 },
] as const;
export type StyleId = (typeof STYLES)[number]["id"];

export const FABRICS = [
  { id: "chiffon", surcharge: 0 },
  { id: "satin", surcharge: 300_000 },
  { id: "silk", surcharge: 900_000 },
  { id: "velvet", surcharge: 800_000 },
  { id: "brocade", surcharge: 1_200_000 },
] as const;
export type FabricId = (typeof FABRICS)[number]["id"];

/** Bảng màu vải — mã màu dùng cho ô màu và hình xem trước */
export const COLORS = [
  { id: "burgundy", hex: "#800020" },
  { id: "vermilion", hex: "#B32530" },
  { id: "ochre", hex: "#C99A2E" },
  { id: "blush", hex: "#E7B3B0" },
  { id: "ivory", hex: "#F3EBDD" },
  { id: "jade", hex: "#3E8E7E" },
  { id: "indigo", hex: "#2E3F7F" },
  { id: "black", hex: "#1F1A1B" },
] as const;
export type ColorId = (typeof COLORS)[number]["id"];

export const COLLARS = ["high", "low", "boat", "sweetheart"] as const;
export type CollarId = (typeof COLLARS)[number];

export const SLEEVES = ["long", "threeQuarter", "short"] as const;
export type SleeveId = (typeof SLEEVES)[number];

export const LENGTHS = ["ankle", "midCalf", "knee"] as const;
export type LengthId = (typeof LENGTHS)[number];

export const DECORATIONS = [
  { id: "plain", surcharge: 0, extraDays: 0 },
  { id: "print", surcharge: 300_000, extraDays: 1 },
  { id: "embroidery", surcharge: 1_500_000, extraDays: 5 },
  { id: "beading", surcharge: 900_000, extraDays: 3 },
] as const;
export type DecorationId = (typeof DECORATIONS)[number]["id"];

/** Hoạ tiết thêu (chỉ khi chọn thêu tay) */
export const MOTIFS = ["lotus", "apricot", "peach", "phoenix"] as const;
export type MotifId = (typeof MOTIFS)[number];

export const PANTS = [
  { id: "silk", surcharge: 350_000 },
  { id: "wide", surcharge: 400_000 },
  { id: "skirt", surcharge: 450_000 },
  { id: "none", surcharge: 0 },
] as const;
export type PantsId = (typeof PANTS)[number]["id"];

/** Cách lấy số đo: size chuẩn · tự nhập số đo · hẹn đo tại tiệm */
export const MEASURE_MODES = ["standard", "custom", "studio"] as const;
export type MeasureMode = (typeof MEASURE_MODES)[number];

export const STANDARD_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type StandardSize = (typeof STANDARD_SIZES)[number];

/** Số đo cần cho áo dài (cm) — khoảng hợp lệ để chặn gõ nhầm */
export const MEASUREMENT_FIELDS = [
  { id: "height", min: 130, max: 200 },
  { id: "bust", min: 60, max: 140 },
  { id: "waist", min: 45, max: 130 },
  { id: "hip", min: 60, max: 150 },
  { id: "shoulder", min: 28, max: 55 },
  { id: "sleeveLength", min: 15, max: 75 },
  { id: "armhole", min: 25, max: 60 },
  { id: "dressLength", min: 80, max: 160 },
] as const;
export type MeasurementId = (typeof MEASUREMENT_FIELDS)[number]["id"];

export const TIMELINES = ["standard", "rush"] as const;
export type Timeline = (typeof TIMELINES)[number];

/** Phụ phí may gấp (theo tỉ lệ tiền áo) */
export const RUSH_RATE = 0.3;
/** Số ngày may nền (đã gồm thử áo & chỉnh sửa) */
export const BASE_DAYS = 7;
/** May gấp: số ngày cố định */
export const RUSH_DAYS = 5;

/** Ảnh đại diện trong giỏ hàng theo kiểu dáng */
export const STYLE_IMAGES: Record<StyleId, string> = {
  traditional: "/images/ex6.jpg",
  modern: "/images/ex5.jpg",
  loose: "/images/ex7.jpg",
  fivePanel: "/images/ex8.jpg",
};

export interface BespokeConfig {
  occasion: Occasion;
  style: StyleId;
  fabric: FabricId;
  color: ColorId;
  collar: CollarId;
  sleeve: SleeveId;
  length: LengthId;
  decoration: DecorationId;
  motif: MotifId;
  pants: PantsId;
  measureMode: MeasureMode;
  size: StandardSize;
  timeline: Timeline;
}

type PresetFields = Omit<BespokeConfig, "occasion" | "measureMode" | "size" | "timeline">;

/** Gợi ý theo dịp mặc — áp vào khi khách chọn dịp */
export const OCCASION_PRESETS: Record<Occasion, PresetFields> = {
  wedding: {
    style: "traditional", fabric: "brocade", color: "burgundy", collar: "high", sleeve: "long",
    length: "ankle", decoration: "embroidery", motif: "phoenix", pants: "silk",
  },
  tet: {
    style: "traditional", fabric: "velvet", color: "vermilion", collar: "high", sleeve: "long",
    length: "ankle", decoration: "embroidery", motif: "apricot", pants: "silk",
  },
  graduation: {
    style: "traditional", fabric: "chiffon", color: "ivory", collar: "high", sleeve: "long",
    length: "ankle", decoration: "plain", motif: "lotus", pants: "silk",
  },
  gala: {
    style: "modern", fabric: "silk", color: "black", collar: "boat", sleeve: "short",
    length: "midCalf", decoration: "beading", motif: "lotus", pants: "skirt",
  },
  daily: {
    style: "loose", fabric: "satin", color: "blush", collar: "low", sleeve: "threeQuarter",
    length: "knee", decoration: "plain", motif: "lotus", pants: "wide",
  },
};

export const DEFAULT_CONFIG: BespokeConfig = {
  occasion: "wedding",
  ...OCCASION_PRESETS.wedding,
  measureMode: "standard",
  size: "M",
  timeline: "standard",
};
