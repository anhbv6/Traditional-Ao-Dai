import { type ActiveDiscount, type CartItem, type CartTotals } from "../types/cart.types";

/** Miễn phí vận chuyển cho đơn từ 1.000.000₫ */
export const FREE_SHIPPING_THRESHOLD = 1_000_000;
/** Phí vận chuyển tiêu chuẩn */
export const STANDARD_SHIPPING_FEE = 30_000;

/**
 * Mã giảm giá demo phía client. Khi có module orders/vouchers, mã phải được xác thực ở Backend
 * (bảng Voucher) và Backend tính lại toàn bộ giá trị đơn — số liệu ở client chỉ để hiển thị.
 */
const DEMO_DISCOUNTS: Record<string, ActiveDiscount> = {
  GIAM10: { code: "GIAM10", type: "percentage", value: 10 },
  FREESHIP: { code: "FREESHIP", type: "freeship", value: 0 },
};

export function findDemoDiscount(code: string): ActiveDiscount | null {
  return DEMO_DISCOUNTS[code.trim().toUpperCase()] ?? null;
}

/**
 * Tính tổng tiền giỏ hàng (giá đã bao gồm VAT). Hàm thuần, dùng chung cho trang giỏ hàng, checkout và mini-cart.
 */
export function calculateCartTotals(items: CartItem[], discount: ActiveDiscount | null = null): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const discountAmount =
    discount?.type === "percentage" ? Math.round((subtotal * discount.value) / 100) : 0;

  const isFreeShipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD || discount?.type === "freeship";
  const shippingCost = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;

  return {
    subtotal,
    discountAmount,
    shippingCost,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    total: Math.max(0, subtotal - discountAmount) + shippingCost,
    totalQuantity,
  };
}

/** Chuyển chuỗi giá VND đã định dạng (ví dụ "1.890.000 ₫") về số nguyên — chỉ dùng cho dữ liệu mock */
export function parseVndString(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}
