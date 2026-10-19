// Checkout dùng chung kiểu dòng giỏ hàng với feature cart
export type { CartItem } from "@/features/cart";
export type { ShippingData, ShippingFormInput } from "../validations/checkout.validation";

/** 3 bước thanh toán (thứ tự hiển thị trên thanh tiến trình) */
export const CHECKOUT_STEPS = ["shipping", "payment", "review"] as const;
export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

/**
 * Phương thức thanh toán:
 * - `cod`  : trả tiền mặt khi nhận hàng.
 * - `bank` : chuyển khoản — hiện thông tin tài khoản + nội dung CK ở bước xác nhận / màn thành công.
 * - `card` : thẻ — KHÔNG nhập số thẻ trên site; sau khi đặt hàng chuyển sang cổng thanh toán (PCI-DSS).
 */
export const PAYMENT_METHODS = ["cod", "bank", "card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Ảnh chụp đơn vừa đặt — giỏ hàng đã được xoá nên màn thành công đọc từ đây */
export interface PlacedOrder {
  orderId: string;
  email: string;
  total: number;
  paymentMethod: PaymentMethod;
}
