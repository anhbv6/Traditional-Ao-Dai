import { CalendarHeart, Hand, MoveVertical, Palette, Ruler, Shirt, Sparkles, Tag, type LucideIcon } from "lucide-react";

/** Nhóm tạo biến thể SKU — có hành vi riêng (bảng màu, thước size); mọi nhóm khác là đặc tính thiết kế */
export const VARIANT_GROUP_CODES = ["COLOR", "SIZE"] as const;
export const isVariantGroup = (code: string) => (VARIANT_GROUP_CODES as readonly string[]).includes(code);

/** Icon theo mã nhóm hệ thống; nhóm admin thêm dùng icon nhãn chung */
export const ATTRIBUTE_GROUP_ICONS: Partial<Record<string, LucideIcon>> = {
  COLOR: Palette,
  SIZE: Ruler,
  NECKLINE: Shirt,
  SLEEVE: Hand,
  PATTERN_TECHNIQUE: Sparkles,
  FLAP_LENGTH: MoveVertical,
  OCCASION: CalendarHeart,
};

/** Icon cho nhóm admin tự thêm */
export const DEFAULT_GROUP_ICON: LucideIcon = Tag;

/** Tên / mô tả nhóm theo ngôn ngữ admin (`en` dùng cột `En`, chưa nhập thì lùi về tiếng Việt) */
export function localizedGroup(
  group: { name: string; nameEn: string | null; description: string | null; descriptionEn: string | null },
  locale: string
) {
  const isEn = locale === "en";
  return {
    name: isEn && group.nameEn ? group.nameEn : group.name,
    description: (isEn && group.descriptionEn ? group.descriptionEn : group.description) ?? "",
  };
}

/** Họ màu để gom bộ lọc màu trên cửa hàng (nhiều sắc "đỏ đô, đỏ son" → một ô "Đỏ") */
export const COLOR_FAMILIES = [
  "RED",
  "PINK",
  "ORANGE",
  "YELLOW",
  "GREEN",
  "BLUE",
  "PURPLE",
  "BROWN",
  "WHITE",
  "GRAY",
  "BLACK",
  "MULTI",
] as const;
export type ColorFamily = (typeof COLOR_FAMILIES)[number];

/** Màu đại diện của từng họ — là dữ liệu màu (không phải màu giao diện) nên được phép dùng sắc thật */
export const COLOR_FAMILY_HEX: Record<ColorFamily, string> = {
  RED: "#C0262D",
  PINK: "#E58FA8",
  ORANGE: "#E8833A",
  YELLOW: "#E9C46A",
  GREEN: "#4F8A5B",
  BLUE: "#3E6FB0",
  PURPLE: "#7B4FA0",
  BROWN: "#7A5236",
  WHITE: "#F7F4EC",
  GRAY: "#9CA3AF",
  BLACK: "#1C1C1E",
  MULTI: "conic-gradient(#C0262D, #E9C46A, #4F8A5B, #3E6FB0, #7B4FA0, #C0262D)",
};

export function isColorFamily(value: unknown): value is ColorFamily {
  return typeof value === "string" && (COLOR_FAMILIES as readonly string[]).includes(value);
}

/** Gợi ý họ màu từ mã hex (theo sắc độ HSL) — admin vẫn chọn lại được */
export function suggestColorFamily(hex: string): ColorFamily | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;
  const n = parseInt(match[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < 0.15 || d < 0.08) return l > 0.85 ? "WHITE" : l < 0.2 ? "BLACK" : "GRAY";
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h < 15 || h >= 345) return l > 0.7 ? "PINK" : "RED";
  if (h < 45) return l < 0.45 ? "BROWN" : "ORANGE";
  if (h < 70) return l < 0.35 ? "BROWN" : "YELLOW";
  if (h < 170) return "GREEN";
  if (h < 255) return "BLUE";
  if (h < 290) return "PURPLE";
  return "PINK";
}

/** Chữ trên nền màu: đen hoặc trắng tùy độ sáng để luôn đọc được */
export function readableOn(hex: string | null): "dark" | "light" {
  const match = hex ? /^#([0-9a-f]{6})$/i.exec(hex) : null;
  if (!match) return "dark";
  const n = parseInt(match[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "dark" : "light";
}

export interface ColorPreset {
  name: string;
  nameEn: string;
  hex: string;
}

/**
 * Các sắc thái màu phổ biến truyền thống trong áo dài & may mặc, phân nhóm theo họ màu.
 * Giúp người quản trị dễ dàng pick màu chuẩn xác, không phải tự nhớ mã HEX.
 */
export const COLOR_PRESETS_BY_FAMILY: Record<ColorFamily, ColorPreset[]> = {
  RED: [
    { name: "Đỏ tươi", nameEn: "Bright Red", hex: "#C0262D" },
    { name: "Đỏ đô", nameEn: "Burgundy", hex: "#8B1E3F" },
    { name: "Đỏ nhung", nameEn: "Crimson Velvet", hex: "#7B1123" },
    { name: "Đỏ cam", nameEn: "Scarlet Orange", hex: "#D64028" },
    { name: "Đỏ gạch", nameEn: "Brick Red", hex: "#A84332" },
    { name: "Đỏ rượu", nameEn: "Wine Red", hex: "#5C131D" },
  ],
  PINK: [
    { name: "Hồng đào", nameEn: "Peach Pink", hex: "#F2A7B5" },
    { name: "Hồng phấn", nameEn: "Powder Pink", hex: "#F8C8D5" },
    { name: "Hồng cánh sen", nameEn: "Lotus Pink", hex: "#E05A88" },
    { name: "Hồng dâu", nameEn: "Berry Pink", hex: "#D4436E" },
    { name: "Hồng pastel", nameEn: "Pastel Pink", hex: "#FADADD" },
    { name: "Hồng đất", nameEn: "Dusty Pink", hex: "#C77B89" },
  ],
  ORANGE: [
    { name: "Cam đất", nameEn: "Terracotta", hex: "#C86036" },
    { name: "Cam san hô", nameEn: "Coral Orange", hex: "#E8833A" },
    { name: "Cam cà rốt", nameEn: "Carrot Orange", hex: "#E65C23" },
    { name: "Cam cháy", nameEn: "Burnt Orange", hex: "#B84A1C" },
    { name: "Cam pastel", nameEn: "Pastel Orange", hex: "#F5B88D" },
  ],
  YELLOW: [
    { name: "Vàng hoàng yến", nameEn: "Canary Yellow", hex: "#E9C46A" },
    { name: "Vàng tươi", nameEn: "Bright Yellow", hex: "#F4D03F" },
    { name: "Vàng mơ", nameEn: "Apricot Yellow", hex: "#F9E4B7" },
    { name: "Vàng mù tạt", nameEn: "Mustard Yellow", hex: "#D4A325" },
    { name: "Vàng đồng", nameEn: "Bronze Gold", hex: "#B8860B" },
    { name: "Vàng kem", nameEn: "Cream Yellow", hex: "#FFF8DC" },
  ],
  GREEN: [
    { name: "Xanh cốm", nameEn: "Young Rice Green", hex: "#A8D582" },
    { name: "Xanh lá mạ", nameEn: "Sprout Green", hex: "#7CBA59" },
    { name: "Xanh rêu", nameEn: "Moss Green", hex: "#4F6340" },
    { name: "Xanh ngọc bích", nameEn: "Jade Green", hex: "#2E8B57" },
    { name: "Xanh lục bảo", nameEn: "Emerald Green", hex: "#1A5F45" },
    { name: "Xanh mint", nameEn: "Mint Green", hex: "#A2E8DD" },
  ],
  BLUE: [
    { name: "Xanh ngọc", nameEn: "Turquoise Blue", hex: "#38A3A5" },
    { name: "Xanh coban", nameEn: "Cobalt Blue", hex: "#1E4D92" },
    { name: "Xanh dương", nameEn: "Classic Blue", hex: "#3E6FB0" },
    { name: "Xanh pastel", nameEn: "Pastel Blue", hex: "#A7C7E7" },
    { name: "Xanh than", nameEn: "Navy Blue", hex: "#1B2A4A" },
    { name: "Xanh da trời", nameEn: "Sky Blue", hex: "#5DADE2" },
  ],
  PURPLE: [
    { name: "Tím huế", nameEn: "Hue Royal Purple", hex: "#5E2568" },
    { name: "Tím cẩm", nameEn: "Violet", hex: "#7B4FA0" },
    { name: "Tím hoa cà", nameEn: "Lilac", hex: "#9E6B9E" },
    { name: "Tím pastel", nameEn: "Pastel Purple", hex: "#C8A2C8" },
    { name: "Tím môn", nameEn: "Taro Purple", hex: "#B48EB6" },
    { name: "Tím than", nameEn: "Deep Purple", hex: "#362247" },
  ],
  BROWN: [
    { name: "Nâu đất", nameEn: "Earth Brown", hex: "#6E473B" },
    { name: "Nâu tây", nameEn: "Caramel Brown", hex: "#8B5A2B" },
    { name: "Nâu be", nameEn: "Beige Brown", hex: "#A67B5B" },
    { name: "Nâu cà phê", nameEn: "Coffee Brown", hex: "#4B3621" },
    { name: "Nâu hạt dẻ", nameEn: "Chestnut Brown", hex: "#5C3A21" },
    { name: "Nâu cánh gián", nameEn: "Amber Brown", hex: "#7A2E18" },
  ],
  WHITE: [
    { name: "Trắng sứ", nameEn: "Porcelain White", hex: "#FDFEFE" },
    { name: "Trắng ngà", nameEn: "Ivory White", hex: "#F7F4EC" },
    { name: "Trắng kem", nameEn: "Cream White", hex: "#FBF6EE" },
    { name: "Trắng sữa", nameEn: "Milky White", hex: "#F3F0E6" },
  ],
  GRAY: [
    { name: "Ghi sáng", nameEn: "Light Gray", hex: "#D1D5DB" },
    { name: "Xám tiêu", nameEn: "Pepper Gray", hex: "#9CA3AF" },
    { name: "Xám khói", nameEn: "Smoke Gray", hex: "#6B7280" },
    { name: "Ghi chì", nameEn: "Charcoal Gray", hex: "#4B5563" },
  ],
  BLACK: [
    { name: "Đen tuyền", nameEn: "Pure Black", hex: "#1C1C1E" },
    { name: "Đen tuyền sâu", nameEn: "Deep Black", hex: "#0A0A0A" },
    { name: "Đen khói", nameEn: "Faded Black", hex: "#2C2C2E" },
  ],
  MULTI: [
    { name: "Đa sắc hoa văn", nameEn: "Patterned Multi", hex: "#C0262D" },
    { name: "Ombre chuyển sắc", nameEn: "Ombre Gradient", hex: "#3E6FB0" },
  ],
};
