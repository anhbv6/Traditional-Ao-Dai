/**
 * Hằng số danh mục dùng chung nhiều feature (không phụ thuộc feature nào).
 * `FEATURED_COLLECTION_IDS`: các bộ sưu tập nổi bật — khớp id trong bộ lọc Cửa hàng (`?category=<id>`),
 * tên hiển thị dịch qua `Product.collections.<id>`. Dùng cho gợi ý ở trạng thái trống (giỏ hàng, yêu thích…).
 */
export const FEATURED_COLLECTION_IDS = ["wedding", "modern", "silk", "brocade", "embroidered"] as const;

export type FeaturedCollectionId = (typeof FEATURED_COLLECTION_IDS)[number];
