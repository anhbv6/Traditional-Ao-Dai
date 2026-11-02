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

const SKU_PREFIX = "AD";

/** Một thành phần của SKU: bỏ dấu, viết liền, in hoa — "Đỏ" → "DO", "Hồng Sen" → "HONGSEN" */
const toSkuPart = (value: string) => toSlug(value).replace(/-/g, "").toUpperCase();

/** Mã mẫu khi chưa nhập mã BST: chữ đầu mỗi từ của tên, bỏ "Áo Dài" — "Áo Dài Gấm Hoa Sen" → "GHS" */
function toDesignCode(productName: string): string {
  return toSlug(productName)
    .replace(/^ao-dai-?/, "")
    .split("-")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 6)
    .toUpperCase();
}

/** Quy tắc SKU: AD-<mã BST hoặc mã mẫu>-<màu>-<size>, VD AD-TET26-DO-S */
export function buildSku(params: { collectionCode: string; productName: string; color: string; size: string }): string {
  const { collectionCode, productName, color, size } = params;

  return [SKU_PREFIX, collectionCode || toDesignCode(productName), toSkuPart(color), toSkuPart(size)]
    .filter(Boolean)
    .join("-");
}

/** Tổ hợp màu + size của một biến thể; hai dòng trùng khóa này là trùng size */
export function toVariantKey(variant: { color?: string | null; size: string }): string {
  return `${(variant.color ?? "").trim().toLowerCase()}|${variant.size.trim().toLowerCase()}`;
}

/** Có hai biến thể cùng màu, cùng size hay không */
export function hasDuplicateVariant(variants: { color?: string | null; size: string }[]): boolean {
  return new Set(variants.map(toVariantKey)).size !== variants.length;
}

/** Danh sách giá trị không trùng, bỏ giá trị rỗng, sắp xếp để dùng cho bộ lọc */
export function uniqueOptions(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
}
