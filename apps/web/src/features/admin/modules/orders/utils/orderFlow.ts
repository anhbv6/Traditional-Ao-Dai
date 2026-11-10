import { type OrderStatus, type PaymentStatus, type TailoringStatus } from "@repo/shared/orders";
import { type AdminOrderRow, type OrderTab } from "../types/orders.types";

/*
 * Luật vòng đời đơn dùng chung cho danh sách, màn chi tiết và Server Action (server kiểm tra lại bằng chính hàm này).
 * Hủy / hoàn tiền KHÔNG đi qua đây — luôn gửi yêu cầu phê duyệt (AGENTS.md §8).
 */

/** Các trạng thái chuyển tay được trên màn đơn hàng (IN_PRODUCTION do xưởng tự chuyển; hủy / hoàn qua phê duyệt) */
export const ADVANCE_STATUSES = ["CONFIRMED", "READY_TO_SHIP", "SHIPPING", "DELIVERED"] as const;
export type AdvanceStatus = (typeof ADVANCE_STATUSES)[number];

/**
 * Bước kế tiếp hợp lệ của từng trạng thái. Đơn có món may đo chỉ đóng gói được khi xưởng đã xong mọi món
 * (`workshopDone`); IN_PRODUCTION do xưởng tự chuyển nên không có ở đây.
 */
export function nextOrderStatus(orderStatus: OrderStatus, workshopDone: boolean): AdvanceStatus | null {
  switch (orderStatus) {
    case "PENDING":
      return "CONFIRMED";
    case "CONFIRMED":
    case "IN_PRODUCTION":
      return workshopDone ? "READY_TO_SHIP" : null;
    case "READY_TO_SHIP":
      return "SHIPPING";
    case "SHIPPING":
      return "DELIVERED";
    default:
      return null;
  }
}

/** Xưởng đã xong cho dòng danh sách / chi tiết (công đoạn chậm nhất đã hoàn tất, hoặc không có món may đo) */
export function isWorkshopDone(order: Pick<AdminOrderRow, "slowestTailoring">): boolean {
  return order.slowestTailoring === null || order.slowestTailoring === "COMPLETED";
}

/** Đơn may đo chỉ được đóng gói khi mọi món đã xong xưởng */
export function canPack(tailoringStatuses: TailoringStatus[]): boolean {
  return tailoringStatuses.every((status) => status === "COMPLETED" || status === "NOT_APPLICABLE");
}

/** Trạng thái thanh toán suy ra từ số tiền đã thu */
export function resolvePaymentStatus(paid: number, total: number, current: PaymentStatus): PaymentStatus {
  if (current === "REFUNDED") return current;
  if (paid <= 0) return "UNPAID";
  if (paid < total) return "PARTIALLY_PAID";
  return "PAID";
}

export function orderTabOf(status: OrderStatus): Exclude<OrderTab, "ALL"> {
  switch (status) {
    case "PENDING":
      return "PENDING";
    case "CONFIRMED":
    case "IN_PRODUCTION":
      return "PROCESSING";
    case "READY_TO_SHIP":
      return "READY_TO_SHIP";
    case "SHIPPING":
      return "SHIPPING";
    case "DELIVERED":
      return "DELIVERED";
    default:
      return "CLOSED";
  }
}

/**
 * "Việc kế tiếp" của một đơn — một câu ngắn trên dòng danh sách để người xem biết phải làm gì,
 * không phải mở từng đơn. `tone` chỉ đổi màu chữ (chờ tiền / chặn = hổ phách, đã xong = xanh).
 */
export type NextStep =
  | { kind: "AWAIT_TRANSFER"; amount: number; tone: "warning" }
  | { kind: "CONFIRM"; tone: "neutral" }
  | { kind: "WORKSHOP"; stage: TailoringStatus; tone: "neutral" }
  | { kind: "PACK"; tone: "neutral" }
  | { kind: "HAND_OVER"; tone: "neutral" }
  | { kind: "COLLECT_ON_DELIVERY"; amount: number; tone: "neutral" }
  | { kind: "AWAIT_DELIVERY"; tone: "neutral" }
  | { kind: "COLLECT_REMAINING"; amount: number; tone: "warning" }
  | { kind: "APPROVAL_PENDING"; tone: "warning" }
  | { kind: "DONE"; tone: "success" }
  | { kind: "CLOSED"; tone: "muted" };

export function resolveNextStep(order: AdminOrderRow): NextStep {
  const remaining = Math.max(0, order.totalAmount - order.paidAmount);
  if (order.pendingApproval) return { kind: "APPROVAL_PENDING", tone: "warning" };

  switch (order.orderStatus) {
    case "PENDING":
      // Đơn chuyển khoản / cọc: chưa đủ tiền thì việc là chờ & đối soát chuyển khoản
      return order.paidAmount < order.depositAmount
        ? { kind: "AWAIT_TRANSFER", amount: order.depositAmount - order.paidAmount, tone: "warning" }
        : { kind: "CONFIRM", tone: "neutral" };
    case "CONFIRMED":
    case "IN_PRODUCTION":
      if (order.isTailored && order.slowestTailoring && order.slowestTailoring !== "COMPLETED") {
        return { kind: "WORKSHOP", stage: order.slowestTailoring, tone: "neutral" };
      }
      return { kind: "PACK", tone: "neutral" };
    case "READY_TO_SHIP":
      return { kind: "HAND_OVER", tone: "neutral" };
    case "SHIPPING":
      return remaining > 0 ? { kind: "COLLECT_ON_DELIVERY", amount: remaining, tone: "neutral" } : { kind: "AWAIT_DELIVERY", tone: "neutral" };
    case "DELIVERED":
      return remaining > 0 ? { kind: "COLLECT_REMAINING", amount: remaining, tone: "warning" } : { kind: "DONE", tone: "success" };
    default:
      return { kind: "CLOSED", tone: "muted" };
  }
}
