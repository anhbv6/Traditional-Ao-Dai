import { type MeasurementKey, type ProductGroup } from "@repo/shared/sizing";

/**
 * Ký hiệu size gợi ý khi thêm hàng — tạm thời cố định ở đây cho tới khi màn Thuộc tính (Ký hiệu size) hoàn thiện.
 * Vẫn cho gõ tay ký hiệu khác.
 */
export const SIZE_LABEL_PRESETS: Record<ProductGroup, readonly string[]> = {
  AO_DAI: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "2-3T", "4-5T", "6-7T", "8-9T", "10-11T", "12-13T"],
  PANTS: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  FOOTWEAR: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43"],
  ACCESSORY: ["Free size"],
  MATERIAL: [],
};

/** Ngưỡng hợp lệ mặc định khi thêm cột — chặn số đo vô lý (VD 650 cm do gõ nhầm) */
export const DEFAULT_VALID_RANGE: Record<MeasurementKey, [number, number]> = {
  height: [80, 200],
  weight: [10, 150],
  age: [1, 100],
  bust: [50, 150],
  waist: [40, 140],
  hips: [50, 160],
  shoulder: [20, 60],
  armpit: [20, 60],
  upperArm: [15, 60],
  armLength: [20, 80],
  shirtLength: [50, 160],
  neck: [20, 50],
  thigh: [30, 90],
  pantsLength: [50, 130],
  legOpening: [20, 80],
  footLength: [18, 32],
};

export const MAX_SIZE_CHART_ROWS = 30;

/** Gợi ý ký hiệu cho hàng mới: ký hiệu đứng sau hàng cuối trong bộ gợi ý (XXL → 3XL), không có thì lấy ký hiệu đầu tiên chưa dùng */
export function nextSizeLabel(group: ProductGroup, used: string[]): string {
  const presets = SIZE_LABEL_PRESETS[group];
  const taken = new Set(used.map((label) => label.toUpperCase()));
  const lastIndex = presets.findIndex((label) => label.toUpperCase() === used.at(-1)?.toUpperCase());
  const isFree = (label: string) => !taken.has(label.toUpperCase());
  return presets.slice(lastIndex + 1).find(isFree) ?? presets.find(isFree) ?? "";
}

let uidCounter = 0;
/** Id tạm cho hàng mới phía client */
export const createRowUid = () => `row-${Date.now().toString(36)}-${(uidCounter++).toString(36)}`;
