import {
  Ban,
  CloudFog,
  CloudSun,
  Droplets,
  Flower2,
  Hand,
  Leaf,
  Shirt,
  Snowflake,
  Sparkles,
  Sun,
  Thermometer,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";

/** Sợi dệt dùng trong thành phần vải (tên hiển thị dịch theo `AdminPage.materials.fiber.<CODE>`) */
export const FIBERS = [
  "SILK",
  "COTTON",
  "LINEN",
  "HEMP",
  "BAMBOO",
  "VISCOSE",
  "POLYESTER",
  "SPANDEX",
  "NYLON",
  "WOOL",
  "OTHER",
] as const;
export type Fiber = (typeof FIBERS)[number];

/** Năm thanh đo vật lý chuẩn hóa 1–5 (thứ tự hiển thị cố định ở thẻ, ma trận và trình soạn) */
export const MATERIAL_METRICS = ["stretch", "thickness", "drape", "sheerness", "sheen"] as const;
export type MaterialMetric = (typeof MATERIAL_METRICS)[number];
export const METRIC_LEVELS = [1, 2, 3, 4, 5] as const;

export const SEASONS = ["SPRING", "SUMMER", "AUTUMN", "WINTER"] as const;
export type Season = (typeof SEASONS)[number];
export const SEASON_ICONS: Record<Season, LucideIcon> = {
  SPRING: Flower2,
  SUMMER: Sun,
  AUTUMN: Leaf,
  WINTER: Snowflake,
};

/** Ký hiệu bảo quản — in lên nhãn may và trang sản phẩm; mã lưu ở DB, chữ dịch theo `careCode.<CODE>` */
export const CARE_CODES = [
  "HAND_WASH",
  "MACHINE_GENTLE",
  "COLD_WATER",
  "NO_BLEACH",
  "NO_WRING",
  "DRY_SHADE",
  "IRON_LOW",
  "STEAM",
  "DRY_CLEAN",
  "STORE_HANGING",
] as const;
export type CareCode = (typeof CARE_CODES)[number];
export const CARE_ICONS: Record<CareCode, LucideIcon> = {
  HAND_WASH: Hand,
  MACHINE_GENTLE: WashingMachine,
  COLD_WATER: Snowflake,
  NO_BLEACH: Ban,
  NO_WRING: Droplets,
  DRY_SHADE: CloudSun,
  IRON_LOW: Thermometer,
  STEAM: CloudFog,
  DRY_CLEAN: Sparkles,
  STORE_HANGING: Shirt,
};

/** Sắc độ đơn sắc cho từng phần sợi trong thanh thành phần (admin không dùng màu thương hiệu) */
export const COMPOSITION_SHADES = ["bg-[#18181B]", "bg-[#71717A]", "bg-[#A1A1AA]", "bg-[#D4D4D8]", "bg-[#E4E4E7]"];

export const MAX_CLOSEUP_IMAGES = 6;
export const MAX_PROCESS_STEPS = 8;
export const MAX_COMPOSITION_ITEMS = 6;

export function isFiber(value: unknown): value is Fiber {
  return typeof value === "string" && (FIBERS as readonly string[]).includes(value);
}

export function isCareCode(value: unknown): value is CareCode {
  return typeof value === "string" && (CARE_CODES as readonly string[]).includes(value);
}

/** Tổng % thành phần — phải đủ 100 khi đã nhập */
export function compositionTotal(items: { percent: number }[]): number {
  return items.reduce((sum, item) => sum + item.percent, 0);
}

/**
 * Số thân áo còn may được từ các cây vải: tính TỪNG cây (vải khác cây khác màu/lô không ghép chung một thân áo).
 * Chưa có định mức thì trả null.
 */
export function topsFromRolls(rolls: { remainingMeters: number }[], metersPerTop: number | null): number | null {
  if (!metersPerTop || metersPerTop <= 0) return null;
  return rolls.reduce((sum, roll) => sum + Math.floor(roll.remainingMeters / metersPerTop), 0);
}
