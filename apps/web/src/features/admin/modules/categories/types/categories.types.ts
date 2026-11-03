import { type ProductGroup } from "@repo/shared/sizing";

export interface AdminCategoryNode {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  group: ProductGroup;
  position: number;
  isActive: boolean;
  parentId: string | null;
  defaultSizeChartId: string | null;
  /** Sản phẩm trực tiếp thuộc loại này */
  productCount: number;
  /** Tổng SKU (biến thể) của các sản phẩm đó */
  skuCount: number;
  children: AdminCategoryNode[];
}

export interface SizeChartOption {
  id: string;
  name: string;
  group: ProductGroup;
  isActive: boolean;
}
