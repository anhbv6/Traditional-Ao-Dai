import { type ActiveDiscount, type CartItem, type CartTotals } from "../types/cart.types";

/** Phí vận chuyển tiêu chuẩn — chỉ miễn phí khi áp mã FREESHIP (không còn ngưỡng theo giá trị đơn) */
export const STANDARD_SHIPPING_FEE = 30_000;
/**
 * Số lượng tối đa cho một dòng giỏ hàng (chống đặt nhầm số lượng lớn).
 * Tồn kho thật phải được Backend kiểm tra lại khi tạo đơn.
 */
export const MAX_LINE_QUANTITY = 10;

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

/** Ép số lượng về khoảng hợp lệ [1, MAX_LINE_QUANTITY] */
export function clampQuantity(quantity: number): number {
  return Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.floor(quantity) || 1));
}

/** % giảm của một dòng so với giá gốc (0 nếu không có giá gốc hợp lệ) */
export function getDiscountPercent(price: number, originalPrice?: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Tính tổng tiền giỏ hàng (giá đã bao gồm VAT). Hàm thuần, dùng chung cho trang giỏ hàng, checkout và mini-cart.
 */
export function calculateCartTotals(items: CartItem[], discount: ActiveDiscount | null = null): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const savings = items.reduce(
    (sum, item) => sum + (item.originalPrice && item.originalPrice > item.price ? (item.originalPrice - item.price) * item.quantity : 0),
    0
  );

  const discountAmount =
    discount?.type === "percentage" ? Math.round((subtotal * discount.value) / 100) : 0;

  const isFreeShipping = subtotal === 0 || discount?.type === "freeship";
  const shippingCost = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;

  return {
    subtotal,
    discountAmount,
    shippingCost,
    savings,
    total: Math.max(0, subtotal - discountAmount) + shippingCost,
    totalQuantity,
  };
}

/** Chuyển chuỗi giá VND đã định dạng (ví dụ "1.890.000 ₫") về số nguyên — chỉ dùng cho dữ liệu mock */
export function parseVndString(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}
