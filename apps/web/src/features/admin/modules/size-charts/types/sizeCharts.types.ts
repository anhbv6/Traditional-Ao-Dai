import { type MeasurementKey, type ProductGroup, type SizeRange } from "@repo/shared/sizing";

export type SurchargeType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface AdminSizeChartListItem {
  id: string;
  name: string;
  nameEn: string | null;
  group: ProductGroup;
  isActive: boolean;
  sizeLabels: string[];
  columnKeys: MeasurementKey[];
  /** Sản phẩm dùng bảng này: gắn trực tiếp + thừa hưởng từ loại sản phẩm */
  productCount: number;
  categoryCount: number;
  hasBigsize: boolean;
  updatedAt: string;
}

export interface SizeChartColumnValue {
  key: MeasurementKey;
  validMin: number | null;
  validMax: number | null;
  bigsizeFrom: number | null;
}

export interface SizeChartRowValue {
  /** Id tạm phía client để giữ key ổn định khi thêm/xóa/sắp xếp hàng */
  uid: string;
  sizeLabel: string;
  values: Partial<Record<MeasurementKey, SizeRange>>;
}

export interface AdminSizeChartDetail {
  id: string;
  name: string;
  nameEn: string;
  group: ProductGroup;
  description: string;
  descriptionEn: string;
  measurementGuide: string;
  measurementGuideEn: string;
  guideImage: string;
  isActive: boolean;
  surchargeType: SurchargeType | null;
  /** FIXED_AMOUNT: số nguyên VND · PERCENTAGE: phần trăm */
  surchargeValue: number | null;
  /** Số mét vải cộng thêm cho đơn bigsize */
  extraFabric: number | null;
  columns: SizeChartColumnValue[];
  rows: SizeChartRowValue[];
  productCount: number;
  categoryNames: string[];
  updatedAt: string;
}
