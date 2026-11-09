import type { CareCode, Season } from "@repo/shared/materials";
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

// Hằng số / kiểu dùng chung với thư mục vải storefront (Express) — nguồn ở `@repo/shared/materials`
export {
  CARE_CODES,
  FIBERS,
  MATERIAL_METRICS,
  METRIC_LEVELS,
  SEASONS,
  isCareCode,
  isFiber,
  topsFromRolls,
  type CareCode,
  type Fiber,
  type MaterialMetric,
  type Season,
} from "@repo/shared/materials";

export const SEASON_ICONS: Record<Season, LucideIcon> = {
  SPRING: Flower2,
  SUMMER: Sun,
  AUTUMN: Leaf,
  WINTER: Snowflake,
};

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

/** Tổng % thành phần — phải đủ 100 khi đã nhập */
export function compositionTotal(items: { percent: number }[]): number {
  return items.reduce((sum, item) => sum + item.percent, 0);
}

