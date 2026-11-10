import { type AdminCustomerRow, type CustomerStats } from "../types/customers.types";

/*
 * Nhóm khách tự suy từ số liệu mua hàng — để lọc nhanh "nên gọi ai", không lưu trong DB.
 */

const DAY = 24 * 60 * 60 * 1000;
/** Từ bấy nhiêu đơn còn hiệu lực trở lên là khách quen */
export const LOYAL_MIN_ORDERS = 2;
/** Tham gia trong bấy nhiêu ngày là khách mới */
export const NEW_CUSTOMER_DAYS = 30;
/** Không mua bấy nhiêu ngày là lâu chưa quay lại */
export const DORMANT_DAYS = 180;

export const CUSTOMER_SEGMENTS = ["LOYAL", "NEW", "MEASURED", "OUTSTANDING", "DORMANT", "LOCKED"] as const;
export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];

export const CUSTOMER_SORTS = ["RECENT", "SPENT", "JOINED"] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];

/** Các nhóm một khách thuộc về (một khách có thể ở nhiều nhóm) */
export function customerSegments(customer: AdminCustomerRow, now: string): CustomerSegment[] {
  const segments: CustomerSegment[] = [];
  const nowMs = Date.parse(now);
  if (customer.activeOrders >= LOYAL_MIN_ORDERS) segments.push("LOYAL");
  if (nowMs - Date.parse(customer.createdAt) <= NEW_CUSTOMER_DAYS * DAY) segments.push("NEW");
  if (customer.measurementCount > 0) segments.push("MEASURED");
  if (customer.outstanding > 0) segments.push("OUTSTANDING");
  if (customer.lastOrderAt && nowMs - Date.parse(customer.lastOrderAt) > DORMANT_DAYS * DAY) segments.push("DORMANT");
  if (customer.status === "LOCKED") segments.push("LOCKED");
  return segments;
}

export function compareCustomers(sort: CustomerSort) {
  return (a: AdminCustomerRow, b: AdminCustomerRow): number => {
    if (sort === "SPENT") return b.spent - a.spent;
    if (sort === "JOINED") return b.createdAt.localeCompare(a.createdAt);
    // Mua gần nhất; chưa mua xuống cuối
    return (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? "");
  };
}

/** Gộp số liệu từ danh sách đơn (tiền đã quy về số nguyên VND) */
export function summarizeOrders(
  orders: { orderStatus: string; totalAmount: number; paidAmount: number; createdAt: string }[]
): CustomerStats {
  const closed = (status: string) => status === "CANCELLED" || status === "REFUNDED";
  const active = orders.filter((order) => !closed(order.orderStatus));
  return {
    ordersCount: orders.length,
    activeOrders: active.length,
    spent: orders.filter((order) => order.orderStatus !== "REFUNDED").reduce((sum, order) => sum + order.paidAmount, 0),
    outstanding: active.reduce((sum, order) => sum + Math.max(0, order.totalAmount - order.paidAmount), 0),
    lastOrderAt: orders.reduce<string | null>((latest, order) => (!latest || order.createdAt > latest ? order.createdAt : latest), null),
  };
}

/** Chữ cái đầu cho ô ảnh đại diện ("Nguyễn Thảo Vy" → "TV") */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const picked = parts.length === 1 ? [parts[0]] : parts.slice(-2);
  return picked.map((part) => part[0]?.toUpperCase() ?? "").join("");
}
