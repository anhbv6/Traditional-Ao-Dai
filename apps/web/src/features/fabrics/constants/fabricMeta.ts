import type { CSSProperties } from "react";
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
import type { CareCode, Fiber, MaterialAvailability, Season } from "@repo/shared/materials";

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

/** Màu chấm tình trạng — chỉ dùng token */
export const AVAILABILITY_DOT: Record<MaterialAvailability, string> = {
  AVAILABLE: "bg-(--success)",
  LIMITED: "bg-(--sale-gold)",
  ON_REQUEST: "bg-(--text-light)",
};

/**
 * "Mặt vải" vẽ bằng CSS khi chất liệu chưa có ảnh cận — mỗi loại sợi một kiểu dệt gợi hình,
 * màu lấy từ token thương hiệu để tự đổi theo chế độ sáng / tối.
 */
const WEAVE: Record<"silk" | "linen" | "brocade" | "sheer" | "plain", CSSProperties> = {
  // Lụa: ánh sáng chạy chéo trên mặt vải trơn
  silk: {
    backgroundColor: "var(--accent-color)",
    backgroundImage:
      "linear-gradient(115deg, transparent 20%, color-mix(in oklab, white 45%, transparent) 38%, transparent 55%), linear-gradient(160deg, color-mix(in oklab, var(--primary-color) 35%, transparent), transparent 70%)",
  },
  // Linen / gai / đũi: sợi dọc ngang thô
  linen: {
    backgroundColor: "var(--bg-secondary)",
    backgroundImage:
      "repeating-linear-gradient(0deg, color-mix(in oklab, var(--text-light) 22%, transparent) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, color-mix(in oklab, var(--text-light) 18%, transparent) 0 1px, transparent 1px 5px)",
  },
  // Gấm: hoa văn chìm dạng thoi trên nền đỏ đô
  brocade: {
    backgroundColor: "var(--primary-color)",
    backgroundImage:
      "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--sale-glow) 55%, transparent) 0 2px, transparent 3px), repeating-linear-gradient(45deg, color-mix(in oklab, var(--sale-glow) 22%, transparent) 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, color-mix(in oklab, var(--sale-glow) 22%, transparent) 0 1px, transparent 1px 14px)",
    backgroundSize: "20px 20px, auto, auto",
  },
  // Voan: nhiều lớp mỏng chồng lên nhau
  sheer: {
    backgroundColor: "var(--bg-card)",
    backgroundImage:
      "radial-gradient(120% 80% at 20% 10%, color-mix(in oklab, var(--accent-color) 45%, transparent), transparent 60%), radial-gradient(90% 70% at 85% 90%, color-mix(in oklab, var(--accent-color) 30%, transparent), transparent 65%)",
  },
  plain: {
    backgroundColor: "var(--bg-secondary)",
    backgroundImage:
      "repeating-linear-gradient(135deg, color-mix(in oklab, var(--accent-color) 25%, transparent) 0 2px, transparent 2px 9px)",
  },
};

const FIBER_WEAVE: Record<Fiber, keyof typeof WEAVE> = {
  SILK: "silk",
  COTTON: "plain",
  LINEN: "linen",
  HEMP: "linen",
  BAMBOO: "linen",
  VISCOSE: "silk",
  POLYESTER: "plain",
  SPANDEX: "plain",
  NYLON: "sheer",
  WOOL: "linen",
  OTHER: "plain",
};

/** Chọn kiểu mặt vải: gấm (bóng + dày) và voan (xuyên thấu) nhận theo thanh đo, còn lại theo sợi chính */
export function weaveStyle(mainFiber: Fiber | undefined, metrics: { sheen: number | null; thickness: number | null; sheerness: number | null }): CSSProperties {
  if ((metrics.sheen ?? 0) >= 5 && (metrics.thickness ?? 0) >= 4) return WEAVE.brocade;
  if ((metrics.sheerness ?? 0) >= 4) return WEAVE.sheer;
  return WEAVE[mainFiber ? FIBER_WEAVE[mainFiber] : "plain"];
}
