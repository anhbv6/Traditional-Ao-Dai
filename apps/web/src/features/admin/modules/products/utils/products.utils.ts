import { type AdminProductItem } from "../types/products.types";

/** SKU còn từ ngần này trở xuống được coi là sắp hết — trùng ngưỡng màn Tồn kho */
export const LOW_STOCK_THRESHOLD = 3;

/** Điều kiện mở bán: 1 ảnh đại diện + ít nhất 1 ảnh mô tả */
export const MIN_IMAGES_TO_ACTIVATE = 2;

export const PRODUCT_STATUS_TABS = ["ALL", "ACTIVE", "LOW_STOCK", "OUT_OF_STOCK", "HIDDEN"] as const;
export type ProductStatusTab = (typeof PRODUCT_STATUS_TABS)[number];

/** Kiểm tra sản phẩm có thuộc tab trạng thái đang chọn hay không */
export function matchesStatusTab(product: AdminProductItem, tab: ProductStatusTab): boolean {
  switch (tab) {
    case "ACTIVE":
      return product.isActive;
    case "HIDDEN":
      return !product.isActive;
    case "OUT_OF_STOCK":
      return product.totalStock === 0;
    case "LOW_STOCK":
      return product.totalStock > 0 && product.lowStockVariants > 0;
    default:
      return true;
  }
}

/** Bỏ dấu tiếng Việt, giữ chữ-số, nối bằng gạch ngang: "Áo Dài Đỏ" → "ao-dai-do" */
export function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Tổ hợp màu + size của một biến thể; hai dòng trùng khóa này là trùng size */
export function toVariantKey(variant: { color?: string | null; size: string }): string {
  return `${(variant.color ?? "").trim().toLowerCase()}|${variant.size.trim().toLowerCase()}`;
}

/** Có hai biến thể cùng màu, cùng size hay không */
export function hasDuplicateVariant(variants: { color?: string | null; size: string }[]): boolean {
  return new Set(variants.map(toVariantKey)).size !== variants.length;
}

export type ActivationIssue = "IMAGES" | "PRICE" | "SKUS" | "DUPLICATE_SKU" | "SET_ITEMS";

/**
 * Các điều kiện mở bán còn thiếu (rỗng = đủ): ảnh đại diện + ít nhất 1 ảnh mô tả, giá > 0, có SKU,
 * không trùng tổ hợp màu + size; bán theo bộ cần khai ít nhất 2 món
 */
export function getActivationIssues(product: {
  images: string[];
  basePrice: number;
  variants: { size: string; color?: string | null }[];
  saleMode?: string;
  setItemCount?: number;
}): ActivationIssue[] {
  const issues: ActivationIssue[] = [];
  if (product.images.length < MIN_IMAGES_TO_ACTIVATE) issues.push("IMAGES");
  if (product.basePrice <= 0) issues.push("PRICE");
  if (product.variants.length === 0) issues.push("SKUS");
  if (hasDuplicateVariant(product.variants)) issues.push("DUPLICATE_SKU");
  if (product.saleMode === "SET" && (product.setItemCount ?? 0) < 2) issues.push("SET_ITEMS");
  return issues;
}

/** Đủ điều kiện mở bán hay chưa */
export function isProductReadyToActivate(product: Parameters<typeof getActivationIssues>[0]): boolean {
  return getActivationIssues(product).length === 0;
}

/** Danh sách giá trị không trùng, bỏ giá trị rỗng, sắp xếp để dùng cho bộ lọc */
export function uniqueOptions(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
}
