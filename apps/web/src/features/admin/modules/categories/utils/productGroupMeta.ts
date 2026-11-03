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
