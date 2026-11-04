import { Footprints, Gem, Layers, Ruler, Shirt, type LucideIcon } from "lucide-react";
import { PRODUCT_GROUP_TRAITS, type ProductGroup } from "@repo/shared/sizing";

/** Biểu tượng từng nhóm hàng — dùng chung cho cây loại sản phẩm, bảng size và form sản phẩm */
export const PRODUCT_GROUP_ICONS: Record<ProductGroup, LucideIcon> = {
  AO_DAI: Shirt,
  PANTS: Layers,
  ACCESSORY: Gem,
  FOOTWEAR: Footprints,
  MATERIAL: Ruler,
};

export type ProductGroupTraitKey = "FULL" | "PANTS" | "THREE_POINT" | "METER" | "FOOT" | "NO_SIZE";

/** Đổi đặc tính nhóm hàng thành các nhãn ngắn hiển thị cạnh tên loại (dịch qua `sizing.trait.<key>`) */
export function getGroupTraitKeys(group: ProductGroup): ProductGroupTraitKey[] {
  const traits = PRODUCT_GROUP_TRAITS[group];
  const keys: ProductGroupTraitKey[] = [];
  if (traits.customMeasurement) keys.push(traits.customMeasurement);
  if (traits.threePointSet) keys.push("THREE_POINT");
  if (traits.sellUnit === "METER") keys.push("METER");
  if (traits.sizing === "FOOT") keys.push("FOOT");
  if (traits.sizing === "NONE") keys.push("NO_SIZE");
  return keys;
}

/** Nhóm hàng có dùng bảng size không (phụ kiện, vải bán theo mét thì không) */
export const groupUsesSizeChart = (group: ProductGroup) => PRODUCT_GROUP_TRAITS[group].sizing !== "NONE";

/**
 * Màu phân loại theo nhóm hàng (nền / chữ / vạch / dây nối) — giúp nhìn danh sách phân khối nhanh.
 * Cố ý KHÔNG dùng emerald / amber / rose vì đã dành cho trạng thái (AGENTS.md §8). Viết đủ tên class để Tailwind quét được.
 */
export const PRODUCT_GROUP_COLORS: Record<
  ProductGroup,
  { chip: string; tile: string; rowBg: string; accent: string; line: string; lineBorder: string }
> = {
  AO_DAI: {
    chip: "bg-violet-50 text-violet-700",
    tile: "bg-violet-100 text-violet-700",
    rowBg: "bg-violet-50/60 hover:bg-violet-50",
    accent: "before:bg-violet-500",
    line: "bg-violet-300",
    lineBorder: "border-violet-300",
  },
  PANTS: {
    chip: "bg-sky-50 text-sky-700",
    tile: "bg-sky-100 text-sky-700",
    rowBg: "bg-sky-50/60 hover:bg-sky-50",
    accent: "before:bg-sky-500",
    line: "bg-sky-300",
    lineBorder: "border-sky-300",
  },
  ACCESSORY: {
    chip: "bg-fuchsia-50 text-fuchsia-700",
    tile: "bg-fuchsia-100 text-fuchsia-700",
    rowBg: "bg-fuchsia-50/60 hover:bg-fuchsia-50",
    accent: "before:bg-fuchsia-500",
    line: "bg-fuchsia-300",
    lineBorder: "border-fuchsia-300",
  },
  FOOTWEAR: {
    chip: "bg-orange-50 text-orange-700",
    tile: "bg-orange-100 text-orange-700",
    rowBg: "bg-orange-50/60 hover:bg-orange-50",
    accent: "before:bg-orange-500",
    line: "bg-orange-300",
    lineBorder: "border-orange-300",
  },
  MATERIAL: {
    chip: "bg-teal-50 text-teal-700",
    tile: "bg-teal-100 text-teal-700",
    rowBg: "bg-teal-50/60 hover:bg-teal-50",
    accent: "before:bg-teal-500",
    line: "bg-teal-300",
    lineBorder: "border-teal-300",
  },
};
