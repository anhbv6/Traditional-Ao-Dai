/**
 * Tuỳ chọn may áo dài theo yêu cầu. Bảng giá / tuỳ chọn nằm ở `@repo/shared/bespoke` (API tính lại giá khi đặt hàng);
 * file này giữ phần chỉ giao diện dùng: ảnh theo kiểu dáng, gợi ý theo dịp mặc, cấu hình mặc định.
 * Chọn DỊP MẶC → gợi ý sẵn bộ tuỳ chọn hợp dịp (khách vẫn đổi được từng mục).
 */
import { type BespokeConfig, type Occasion, type StyleId } from "@repo/shared/bespoke";

export * from "@repo/shared/bespoke";

/** Ảnh đại diện trong giỏ hàng theo kiểu dáng */
export const STYLE_IMAGES: Record<StyleId, string> = {
  traditional: "/images/ex6.jpg",
  modern: "/images/ex5.jpg",
  loose: "/images/ex7.jpg",
  fivePanel: "/images/ex8.jpg",
};

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
