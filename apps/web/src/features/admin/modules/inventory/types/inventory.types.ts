import { type ProductGroup } from "@repo/shared/sizing";

/** Lý do điều chỉnh tồn — ghi vào AuditLog để sau này đối chiếu (màn lịch sử biến động) */
export const STOCK_ADJUST_REASONS = ["RECEIVED", "STOCKTAKE", "SOLD_IN_STORE", "RETURNED", "DAMAGED"] as const;
export type StockAdjustReason = (typeof STOCK_ADJUST_REASONS)[number];

/** Tình trạng một SKU — tính từ tồn, không lưu */
export type SkuStockStatus = "OK" | "LOW" | "OUT";

/** Tình trạng cả sản phẩm — gộp từ các SKU */
export type SkuProductStatus = "OK" | "PARTIAL" | "OUT" | "INACTIVE";

export interface AdminSkuVariant {
  id: string;
  sku: string;
  size: string;
  colorId: string | null;
  /** Tên màu lưu kèm SKU (còn khi thuộc tính màu bị xóa) */
  colorName: string | null;
  hex: string | null;
  stock: number;
  updatedAt: string;
}

export interface AdminSkuProduct {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  image: string | null;
  categoryName: string;
  categoryNameEn: string | null;
  group: ProductGroup;
  isActive: boolean;
  variants: AdminSkuVariant[];
}

export interface AdminSkuStockData {
  products: AdminSkuProduct[];
  /** Thứ tự ký hiệu size theo thước (thuộc tính SIZE) — để cột size xếp S → M → L thay vì theo chữ cái */
  sizeOrder: string[];
  /** Mốc "bây giờ" của server — thời gian tương đối giống nhau ở server và client */
  now: string;
}
