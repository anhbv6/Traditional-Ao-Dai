// Checkout dùng chung kiểu dòng giỏ hàng với feature cart
export type { CartItem } from "@/features/cart";
export type { ShippingData, ShippingFormInput } from "../validations/checkout.validation";
export type { PaymentMethod } from "@repo/shared/orders";

/** 3 bước thanh toán (thứ tự hiển thị trên thanh tiến trình) */
export const CHECKOUT_STEPS = ["shipping", "payment", "review"] as const;
export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];
