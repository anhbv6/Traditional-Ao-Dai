import { type AdminVoucher, type DiscountType } from "../types/vouchers.types";

/*
 * Luật coupon dùng chung cho danh sách, màn soạn (xem trước / thử tính) và Server Action.
 * Khi nối voucher vào thanh toán, server tính giảm giá bằng đúng `computeDiscount`.
 */

export const SHOP_TIME_ZONE = "Asia/Ho_Chi_Minh";
/** Mã: chữ in hoa, số, gạch ngang — dễ đọc qua điện thoại, không nhầm dấu */
export const VOUCHER_CODE_REGEX = /^[A-Z0-9][A-Z0-9-]{2,29}$/;

export const VOUCHER_STATES = ["RUNNING", "SCHEDULED", "ENDED", "DISABLED"] as const;
export type VoucherState = (typeof VOUCHER_STATES)[number];

/** Lý do một coupon không còn dùng được — tách "hết hạn" và "hết lượt" để biết nên gia hạn hay nâng lượt */
export type VoucherEndReason = "EXPIRED" | "USED_UP" | null;

export function voucherState(voucher: Pick<AdminVoucher, "isActive" | "startDate" | "endDate" | "usageLimit" | "usedCount">, now: string): VoucherState {
  if (!voucher.isActive) return "DISABLED";
  if (endReason(voucher, now)) return "ENDED";
  if (voucher.startDate > now) return "SCHEDULED";
  return "RUNNING";
}

export function endReason(voucher: Pick<AdminVoucher, "endDate" | "usageLimit" | "usedCount">, now: string): VoucherEndReason {
  if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) return "USED_UP";
  if (voucher.endDate < now) return "EXPIRED";
  return null;
}

/**
 * Số tiền giảm cho một đơn: chưa đạt đơn tối thiểu → 0; theo % thì làm tròn xuống tới nghìn đồng và chặn bởi mức tối đa;
 * không bao giờ vượt giá trị đơn.
 */
export function computeDiscount(
  rule: { discountType: DiscountType; value: number; minOrderValue: number | null; maxDiscount: number | null },
  orderValue: number
): number {
  if (orderValue <= 0 || (rule.minOrderValue !== null && orderValue < rule.minOrderValue)) return 0;
  const raw = rule.discountType === "PERCENTAGE" ? Math.floor((orderValue * rule.value) / 100 / 1000) * 1000 : rule.value;
  const capped = rule.discountType === "PERCENTAGE" && rule.maxDiscount !== null ? Math.min(raw, rule.maxDiscount) : raw;
  return Math.max(0, Math.min(capped, orderValue));
}

/** Sinh mã gợi ý "THIENCANH-XXXX" (bỏ ký tự dễ nhầm O/0, I/1) */
export function suggestVoucherCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `THIENCANH-${suffix}`;
}

/** YYYY-MM-DD theo giờ tiệm */
export function toShopDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

/** Ngày bắt đầu = 00:00, ngày kết thúc = 23:59:59 giờ tiệm */
export function dayToIso(day: string, edge: "start" | "end"): string {
  return new Date(`${day}T${edge === "start" ? "00:00:00" : "23:59:59"}+07:00`).toISOString();
}
