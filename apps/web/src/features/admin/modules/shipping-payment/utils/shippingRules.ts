import {
  DEPOSIT_PERCENT_MAX,
  DEPOSIT_PERCENT_MIN,
  computePrepayAmount,
  isPaymentMethodAllowed,
  type PaymentMethod,
} from "@repo/shared/orders";
import { type Carrier, type Province, type ShippingPaymentSettings, type ShippingZone } from "../types/shippingPayment.types";

/*
 * Luật vận chuyển & thanh toán dùng chung cho màn cấu hình (thử tính đơn, kiểm tra cấu hình) và — khi nối DB —
 * phần tính lại đơn ở API (`orders.service` hiện dùng phí cố định STANDARD_SHIPPING_FEE). Server luôn tính lại.
 */

export const SHOP_TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY_MS = 24 * 60 * 60 * 1000;
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const findZone = (provinceCode: string, zones: ShippingZone[]) => zones.find((zone) => zone.provinceCodes.includes(provinceCode)) ?? null;

export type FreeReason = "THRESHOLD" | "TAILORED" | "PICKUP" | null;

export interface ShippingQuote {
  zone: ShippingZone | null;
  carrier: Carrier | null;
  /** Phí trước khi miễn */
  rawFee: number;
  fee: number;
  freeReason: FreeReason;
  /** Còn thiếu bao nhiêu để được miễn phí (null = không áp / đã miễn) */
  missingForFree: number | null;
  etaMinDays: number;
  etaMaxDays: number;
}

/**
 * Phí giao một đơn: phí món đầu + phụ phí mỗi món thêm theo vùng; miễn khi nhận tại tiệm, đơn có áo may đo (nếu bật)
 * hoặc đạt ngưỡng (chỉ vùng được miễn). Tỉnh chưa thuộc vùng nào → `zone` null (không giao được).
 */
export function quoteShipping(
  settings: ShippingPaymentSettings,
  input: { provinceCode: string; subtotal: number; items: number; hasTailored: boolean; pickup: boolean }
): ShippingQuote {
  if (input.pickup) {
    const carrier = settings.carriers.find((item) => item.kind === "PICKUP" && item.isActive) ?? null;
    return { zone: null, carrier, rawFee: 0, fee: 0, freeReason: "PICKUP", missingForFree: null, etaMinDays: 0, etaMaxDays: 0 };
  }
  const zone = findZone(input.provinceCode, settings.zones);
  if (!zone) return { zone: null, carrier: null, rawFee: 0, fee: 0, freeReason: null, missingForFree: null, etaMinDays: 0, etaMaxDays: 0 };
  const carrier = settings.carriers.find((item) => item.id === zone.carrierId) ?? null;
  const rawFee = zone.baseFee + Math.max(0, input.items - 1) * zone.extraItemFee;
  const { freeShipping } = settings;
  let freeReason: FreeReason = null;
  if (freeShipping.enabled && freeShipping.tailoredAlwaysFree && input.hasTailored) freeReason = "TAILORED";
  else if (freeShipping.enabled && zone.freeShipEligible && input.subtotal >= freeShipping.threshold) freeReason = "THRESHOLD";
  const missingForFree =
    !freeReason && freeShipping.enabled && zone.freeShipEligible && rawFee > 0 ? Math.max(0, freeShipping.threshold - input.subtotal) : null;
  return {
    zone,
    carrier,
    rawFee,
    fee: freeReason ? 0 : rawFee,
    freeReason,
    missingForFree,
    etaMinDays: zone.etaMinDays,
    etaMaxDays: zone.etaMaxDays,
  };
}

export type MethodBlock = "DISABLED" | "TAILORED_NO_COD" | "COD_LIMIT" | "DEPOSIT_REQUIRED" | null;

export interface PaymentOption {
  method: PaymentMethod;
  block: MethodBlock;
  /** Phải chuyển khoản trước */
  prepay: number;
  /** Thu khi nhận hàng */
  onDelivery: number;
}

/** Phương thức khách được chọn cho một đơn + số tiền chuyển trước / thu khi nhận (dùng đúng `computePrepayAmount` của API) */
export function paymentOptions(settings: ShippingPaymentSettings, input: { total: number; hasTailored: boolean }): PaymentOption[] {
  return settings.methods.map(({ method, enabled }) => {
    let block: MethodBlock = null;
    if (!enabled) block = "DISABLED";
    else if (!isPaymentMethodAllowed(method, input.hasTailored)) block = "TAILORED_NO_COD";
    else if (method === "COD" && settings.cod.maxOrderValue !== null && input.total > settings.cod.maxOrderValue) block = "COD_LIMIT";
    else if (method === "COD" && settings.deposit.requiredAbove !== null && input.total >= settings.deposit.requiredAbove) block = "DEPOSIT_REQUIRED";
    const prepay = computePrepayAmount(input.total, method, settings.deposit.percent);
    return { method, block, prepay, onDelivery: Math.max(0, input.total - prepay) };
  });
}

/** Ngày giao dự kiến: đặt trước giờ chốt thì chuẩn bị từ hôm nay; + ngày chuẩn bị + ngày đi đường (YYYY-MM-DD giờ tiệm) */
export function deliveryWindow(now: string, prepDays: number, cutoffTime: string, etaMinDays: number, etaMaxDays: number): { from: string; to: string } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(now));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  const today = Date.parse(`${get("year")}-${get("month")}-${get("day")}T00:00:00Z`);
  const afterCutoff = `${get("hour")}:${get("minute")}` >= cutoffTime;
  const ready = today + ((afterCutoff ? 1 : 0) + prepDays) * DAY_MS;
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { from: day(ready + etaMinDays * DAY_MS), to: day(ready + etaMaxDays * DAY_MS) };
}

export type SettingsIssue =
  | { kind: "UNASSIGNED"; level: "block"; provinces: Province[] }
  | { kind: "DUPLICATE"; level: "block"; province: Province; zones: string[] }
  | { kind: "NO_METHOD"; level: "block" }
  | { kind: "NO_TAILORED_METHOD"; level: "block" }
  | { kind: "BANK_INCOMPLETE"; level: "block" }
  | { kind: "ZONE_CARRIER_OFF"; level: "warn"; zone: ShippingZone; carrier: string }
  | { kind: "ETA_INVALID"; level: "block"; zone: ShippingZone }
  | { kind: "ZONE_EMPTY"; level: "warn"; zone: ShippingZone }
  | { kind: "DEPOSIT_RANGE"; level: "block" }
  | { kind: "COD_BELOW_DEPOSIT"; level: "warn" }
  | { kind: "CUTOFF_INVALID"; level: "block" };

/** Kiểm tra cấu hình trước khi lưu — `block` chặn lưu, `warn` chỉ nhắc */
export function settingsIssues(settings: ShippingPaymentSettings, provinces: Province[]): SettingsIssue[] {
  const issues: SettingsIssue[] = [];
  const unassigned = provinces.filter((province) => !findZone(province.code, settings.zones));
  if (unassigned.length) issues.push({ kind: "UNASSIGNED", level: "block", provinces: unassigned });
  for (const province of provinces) {
    const zones = settings.zones.filter((zone) => zone.provinceCodes.includes(province.code));
    if (zones.length > 1) issues.push({ kind: "DUPLICATE", level: "block", province, zones: zones.map((zone) => zone.name) });
  }
  for (const zone of settings.zones) {
    if (zone.provinceCodes.length === 0) issues.push({ kind: "ZONE_EMPTY", level: "warn", zone });
    if (zone.etaMinDays > zone.etaMaxDays) issues.push({ kind: "ETA_INVALID", level: "block", zone });
    const carrier = settings.carriers.find((item) => item.id === zone.carrierId);
    if (carrier && !carrier.isActive) issues.push({ kind: "ZONE_CARRIER_OFF", level: "warn", zone, carrier: carrier.name });
  }
  const enabled = new Set(settings.methods.filter((item) => item.enabled).map((item) => item.method));
  if (enabled.size === 0) issues.push({ kind: "NO_METHOD", level: "block" });
  else if (!enabled.has("BANK_TRANSFER") && !enabled.has("DEPOSIT")) issues.push({ kind: "NO_TAILORED_METHOD", level: "block" });
  const usesBank = enabled.has("BANK_TRANSFER") || enabled.has("DEPOSIT");
  const { bank } = settings;
  if (usesBank && (!/^\d{6}$/.test(bank.bankBin) || !/^\d{6,19}$/.test(bank.accountNumber) || !bank.accountName.trim())) issues.push({ kind: "BANK_INCOMPLETE", level: "block" });
  if (settings.deposit.percent < DEPOSIT_PERCENT_MIN || settings.deposit.percent > DEPOSIT_PERCENT_MAX) issues.push({ kind: "DEPOSIT_RANGE", level: "block" });
  if (
    enabled.has("COD") &&
    settings.cod.maxOrderValue !== null &&
    settings.deposit.requiredAbove !== null &&
    settings.deposit.requiredAbove > settings.cod.maxOrderValue
  )
    issues.push({ kind: "COD_BELOW_DEPOSIT", level: "warn" });
  if (!TIME_REGEX.test(settings.fulfillment.cutoffTime)) issues.push({ kind: "CUTOFF_INVALID", level: "block" });
  return issues;
}

/** Tên chủ tài khoản: in hoa, bỏ dấu (giống tên hiện trên app ngân hàng) */
export const normalizeAccountName = (raw: string) =>
  raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trimStart();

export const mockId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
