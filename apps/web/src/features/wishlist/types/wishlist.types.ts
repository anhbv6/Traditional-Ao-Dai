/**
 * Một sản phẩm trong danh sách yêu thích — bản chụp thông tin tại thời điểm thả tim.
 * Tiền tệ: số nguyên VND (định dạng bằng `formatVnd` từ @repo/shared khi hiển thị).
 * Khi có API wishlist ở Backend, chỉ cần lưu `slug` và lấy dữ liệu mới nhất từ server.
 */
export interface WishlistItem {
  /** Slug sản phẩm — khóa nhận diện (trùng với khóa trong giỏ hàng) */
  slug: string;
  name: string;
  image: string;
  /** Giá VND (số nguyên) */
  price: number;
  /** Giá gốc VND trước khuyến mãi (nếu có) */
  originalPrice?: number;
  /** Dòng phụ: chất liệu hoặc mô tả ngắn */
  subline?: string;
  /** `custom` — đặt may theo số đo, phải chọn số đo ở trang chi tiết (không thêm thẳng vào giỏ) */
  purchaseType: "ready" | "custom";
  /** Thời điểm thêm (epoch ms) — dùng để sắp xếp "Mới thêm" */
  addedAt: number;
}

export type NewWishlistItem = Omit<WishlistItem, "addedAt">;

export type WishlistSortKey = "recent" | "priceAsc" | "priceDesc";
