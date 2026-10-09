/**
 * Một dòng trong giỏ hàng. Tiền tệ: số nguyên VND (định dạng bằng `formatVnd` từ @repo/shared khi hiển thị).
 */
export interface CartItem {
  /** Khóa dòng = slug + size + màu (+ số đo nếu may đo): cùng biến thể thì cộng dồn số lượng */
  id: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  /** Tên màu đã chọn (không có khi thêm nhanh từ thẻ sản phẩm) */
  color?: string;
  /** Số đo may đo (cm), khóa là nhãn số đo đã dịch (VD: "Vòng ngực") — chỉ có với size may đo */
  measurements?: Record<string, string>;
  /** Đơn giá VND (số nguyên) */
  price: number;
  /** Giá gốc VND trước khuyến mãi (nếu có) — chỉ để hiển thị */
  originalPrice?: number;
  quantity: number;
}

export type NewCartItem = Omit<CartItem, "id" | "quantity"> & { quantity?: number };

export interface ActiveDiscount {
  code: string;
  type: "percentage" | "freeship";
  value: number;
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  freeShippingThreshold: number;
  /** Số tiền còn thiếu để được miễn phí vận chuyển (0 khi đã đạt hoặc có mã freeship) */
  freeShippingRemaining: number;
  total: number;
  totalQuantity: number;
}
