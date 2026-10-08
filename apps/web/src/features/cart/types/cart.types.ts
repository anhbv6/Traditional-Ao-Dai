/**
 * Một dòng trong giỏ hàng. Tiền tệ: số nguyên VND (định dạng bằng `formatVnd` từ @repo/shared khi hiển thị).
 */
export interface CartItem {
  /** Khóa dòng giỏ hàng = `${slug}__${size}` (cùng sản phẩm + cùng size thì cộng dồn số lượng) */
  id: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  /** Đơn giá VND (số nguyên) */
  price: number;
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
  total: number;
  totalQuantity: number;
}
