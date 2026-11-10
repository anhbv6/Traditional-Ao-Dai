import {
  type AdminSkuProduct,
  type AdminSkuVariant,
  type SkuProductStatus,
  type SkuStockStatus,
  type StockAdjustReason,
} from "../types/inventory.types";

/** Còn từ bấy nhiêu cái trở xuống thì báo sắp hết — tiệm nhỏ, mỗi size thường chỉ giữ vài chiếc */
export const LOW_STOCK_UNITS = 2;

export const FREE_SIZE = "FREE_SIZE";

/** Lý do quyết định ô nhập nghĩa là gì: cộng thêm, trừ đi, hay số đếm thực tế */
export const REASON_MODE: Record<StockAdjustReason, "ADD" | "SUBTRACT" | "SET"> = {
  RECEIVED: "ADD",
  RETURNED: "ADD",
  SOLD_IN_STORE: "SUBTRACT",
  DAMAGED: "SUBTRACT",
  STOCKTAKE: "SET",
};

export const SKU_STATUS_ORDER: Record<SkuStockStatus, number> = { OUT: 0, LOW: 1, OK: 2 };
export const PRODUCT_STATUS_ORDER: Record<SkuProductStatus, number> = { OUT: 0, PARTIAL: 1, OK: 2, INACTIVE: 3 };

export function resolveSkuStatus(stock: number): SkuStockStatus {
  if (stock <= 0) return "OUT";
  if (stock <= LOW_STOCK_UNITS) return "LOW";
  return "OK";
}

/** Hết sạch mọi SKU = Hết hàng; có SKU hết / sắp hết = Thiếu size; sản phẩm đã ẩn = Ngừng bán */
export function resolveProductStatus(product: AdminSkuProduct): SkuProductStatus {
  if (!product.isActive) return "INACTIVE";
  const statuses = product.variants.map((variant) => resolveSkuStatus(variant.stock));
  if (statuses.every((status) => status === "OUT")) return "OUT";
  if (statuses.some((status) => status !== "OK")) return "PARTIAL";
  return "OK";
}

export function totalStock(product: AdminSkuProduct): number {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
}

/** Xếp size theo thứ tự thước; size lạ theo chữ cái, FREE_SIZE cuối cùng */
export function sortSizes(sizes: string[], order: string[]): string[] {
  const rank = (size: string) => {
    if (size === FREE_SIZE) return Number.MAX_SAFE_INTEGER;
    const index = order.indexOf(size);
    return index === -1 ? order.length : index;
  };
  return [...new Set(sizes)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "vi", { numeric: true }));
}

/** Khóa màu của SKU — theo thuộc tính màu, không có thì theo tên lưu kèm */
export function colorKey(variant: Pick<AdminSkuVariant, "colorId" | "colorName">): string {
  return variant.colorId ?? `name:${variant.colorName ?? ""}`;
}

export interface ColorRow {
  key: string;
  name: string | null;
  hex: string | null;
}

/** Các màu của sản phẩm theo thứ tự xuất hiện (đã xếp theo vị trí thuộc tính ở query) */
export function colorRows(product: AdminSkuProduct): ColorRow[] {
  const rows = new Map<string, ColorRow>();
  for (const variant of product.variants) {
    const key = colorKey(variant);
    if (!rows.has(key)) rows.set(key, { key, name: variant.colorName, hex: variant.hex });
  }
  return [...rows.values()];
}

export interface SizeSummary {
  size: string;
  total: number;
  /** Tình trạng theo tổng các màu */
  status: SkuStockStatus;
  /** Còn hàng nhưng có màu đã hết ở size này */
  hasColorGap: boolean;
}

/** Tổng tồn theo size (cộng các màu) — dải size ở dòng sản phẩm */
export function sizeSummary(product: AdminSkuProduct, order: string[]): SizeSummary[] {
  return sortSizes(
    product.variants.map((variant) => variant.size),
    order
  ).map((size) => {
    const variants = product.variants.filter((variant) => variant.size === size);
    const total = variants.reduce((sum, variant) => sum + variant.stock, 0);
    return {
      size,
      total,
      status: resolveSkuStatus(total),
      hasColorGap: total > 0 && variants.some((variant) => variant.stock <= 0),
    };
  });
}

/** Tồn sau khi áp số vừa nhập theo lý do (null = ô bỏ trống, không đổi) */
export function applyStockInput(current: number, reason: StockAdjustReason, value: number | null): number | null {
  if (value === null) return null;
  const mode = REASON_MODE[reason];
  if (mode === "SET") return value;
  if (mode === "ADD") return current + value;
  return current - value;
}

/** Đọc số nguyên không âm từ ô nhập; rỗng = null */
export function parseUnits(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : null;
}
