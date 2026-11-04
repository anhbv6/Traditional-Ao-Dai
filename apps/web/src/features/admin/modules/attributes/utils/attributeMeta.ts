import { CalendarHeart, Hand, MoveVertical, Palette, Ruler, Shirt, Sparkles, type LucideIcon } from "lucide-react";

export const ATTRIBUTE_GROUPS = [
  "COLOR",
  "SIZE",
  "NECKLINE",
  "SLEEVE",
  "PATTERN_TECHNIQUE",
  "FLAP_LENGTH",
  "OCCASION",
] as const;
export type AttributeGroup = (typeof ATTRIBUTE_GROUPS)[number];

/** Hai khối trên thanh chọn: tạo biến thể SKU và đặc tính thiết kế để lọc / mô tả sản phẩm */
export const ATTRIBUTE_SECTIONS = [
  { key: "variant", groups: ["COLOR", "SIZE"] },
  { key: "design", groups: ["NECKLINE", "SLEEVE", "PATTERN_TECHNIQUE", "FLAP_LENGTH", "OCCASION"] },
] as const satisfies readonly { key: string; groups: readonly AttributeGroup[] }[];

export const ATTRIBUTE_GROUP_ICONS: Record<AttributeGroup, LucideIcon> = {
  COLOR: Palette,
  SIZE: Ruler,
  NECKLINE: Shirt,
  SLEEVE: Hand,
  PATTERN_TECHNIQUE: Sparkles,
  FLAP_LENGTH: MoveVertical,
  OCCASION: CalendarHeart,
};

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
