import { type AdminCategoryNode } from "../types/categories.types";

/**
 * Tên loại sản phẩm theo ngôn ngữ giao diện admin:
 * - Tiếng Việt (`vi`): ưu tiên `name`, lùi về `nameEn`.
 * - Tiếng Anh hoặc ngôn ngữ khác: ưu tiên `nameEn` (default), lùi về `name`.
 * Tên nhóm gốc luôn có đủ hai bản — cố định theo `PRODUCT_GROUP_NAMES`.
 */
export function categoryName(node: Pick<AdminCategoryNode, "name" | "nameEn">, locale: string): string {
  if (locale === "vi") {
    return node.name || node.nameEn || "";
  }
  return node.nameEn || node.name || "";
}
