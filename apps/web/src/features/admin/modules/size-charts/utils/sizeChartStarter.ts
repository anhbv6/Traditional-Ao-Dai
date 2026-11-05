import { PRODUCT_GROUP_TRAITS, type ProductGroup } from "@repo/shared/sizing";
import { type SizeChartColumnValue, type SizeChartRowValue } from "../types/sizeCharts.types";
import { DEFAULT_VALID_RANGE, createRowUid } from "./sizeChartPresets";

/** Hàng size dựng sẵn khi nhập bảng size riêng cho một loại sản phẩm — admin chỉ việc điền số đo, thêm / bớt hàng */
const STARTER_SIZE_LABELS: Record<ProductGroup, readonly string[]> = {
  AO_DAI: ["S", "M", "L", "XL"],
  PANTS: ["S", "M", "L", "XL"],
  FOOTWEAR: ["35", "36", "37", "38", "39"],
  ACCESSORY: [],
  MATERIAL: [],
};

/** Dữ liệu Prisma (nested create) cho bảng size mới của một nhóm hàng: cột số đo gợi ý theo nhóm, kèm ngưỡng hợp lệ */
export function buildStarterSizeChart(group: ProductGroup) {
  return {
    columns: {
      create: PRODUCT_GROUP_TRAITS[group].suggestedKeys.map((key, position) => ({
        key,
        position,
        validMin: DEFAULT_VALID_RANGE[key][0],
        validMax: DEFAULT_VALID_RANGE[key][1],
      })),
    },
  };
}

/** Lưới khởi đầu phía client (cột số đo gợi ý + hàng size trống) cho trình nhập bảng size */
export function createStarterGrid(group: ProductGroup): { columns: SizeChartColumnValue[]; rows: SizeChartRowValue[] } {
  return {
    columns: PRODUCT_GROUP_TRAITS[group].suggestedKeys.map((key) => ({
      key,
      validMin: DEFAULT_VALID_RANGE[key][0],
      validMax: DEFAULT_VALID_RANGE[key][1],
      bigsizeFrom: null,
    })),
    rows: STARTER_SIZE_LABELS[group].map((sizeLabel) => ({ uid: createRowUid(), sizeLabel, values: {} })),
  };
}
