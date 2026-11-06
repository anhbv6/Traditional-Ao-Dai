import { type AdminCategoryNode } from "../types/categories.types";

/**
 * Tên loại sản phẩm theo ngôn ngữ giao diện admin: `en` dùng `nameEn` (chưa nhập thì lùi về tên tiếng Việt).
 * Tên nhóm gốc luôn có đủ hai bản — cố định theo `PRODUCT_GROUP_NAMES`.
 */
export function categoryName(node: Pick<AdminCategoryNode, "name" | "nameEn">, locale: string): string {
  return locale === "en" && node.nameEn ? node.nameEn : node.name;
}
