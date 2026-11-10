import { AFTER_SALES_WINDOWS } from "@/features/after-sales";
import { type AfterSalesTicket, type TicketAction, type TicketStatus } from "../types/returns.types";

/*
 * Luật xử lý phiếu hậu mãi — dùng chung cho hàng đợi và phiếu chi tiết. Khi có API, server áp đúng các luật này.
 */

export const SHOP_TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY = 24 * 60 * 60 * 1000;

/** Phiếu mới chưa tiếp nhận quá bấy nhiêu ngày thì nhắc (khách đang chờ phản hồi) */
export const RESPONSE_DUE_DAYS = 1;

/** Tab hàng đợi theo chỗ chiếc áo đang ở trong quy trình */
export const DESK_TABS = ["NEW", "ACCEPTED", "RECEIVED", "READY", "DONE", "REJECTED"] as const satisfies readonly TicketStatus[];

export interface Eligibility {
  /** Số ngày từ lúc nhận hàng tới lúc gửi yêu cầu */
  daysSinceDelivery: number;
  windowDays: number;
  /** Còn trong hạn chính sách */
  inWindow: boolean;
  /** Áo may đo mà khách xin đổi / trả — ngoài phạm vi */
  customFitBlocked: boolean;
}

/** Đối chiếu yêu cầu với chính sách: hạn theo loại (tính tới ngày gửi) và phạm vi áo may đo */
export function checkEligibility(ticket: AfterSalesTicket): Eligibility {
  const daysSinceDelivery = Math.floor((Date.parse(ticket.createdAt) - Date.parse(ticket.deliveredAt)) / DAY);
  const windowDays = AFTER_SALES_WINDOWS[ticket.service];
  return {
    daysSinceDelivery,
    windowDays,
    inWindow: daysSinceDelivery <= windowDays,
    customFitBlocked: ticket.isCustomFit && (ticket.service === "EXCHANGE" || ticket.service === "RETURN"),
  };
}

/** Số ngày phiếu đã nằm ở trạng thái hiện tại */
export function daysInStatus(ticket: AfterSalesTicket, now: string): number {
  const since = ticket.events[0]?.createdAt ?? ticket.createdAt;
  return Math.max(0, Math.floor((Date.parse(now) - Date.parse(since)) / DAY));
}

/** Việc chính của phiếu ở trạng thái hiện tại (nút chính ở phiếu chi tiết) */
export type PrimaryStep = "ACCEPT" | "RECEIVE" | "READY" | "REQUEST_REFUND" | "DONE" | null;

export function primaryStep(ticket: AfterSalesTicket): PrimaryStep {
  switch (ticket.status) {
    case "NEW":
      return "ACCEPT";
    case "ACCEPTED":
      return "RECEIVE";
    case "RECEIVED":
      // Trả hàng: kiểm tra áo xong thì gửi duyệt hoàn tiền; còn lại là sửa / đổi xong
      return ticket.service === "RETURN" ? "REQUEST_REFUND" : "READY";
    case "READY":
      return "DONE";
    default:
      return null;
  }
}

/** Áp một thao tác vào phiếu (mock: đổi state ở client) */
export function applyTicketAction(ticket: AfterSalesTicket, action: TicketAction, actorName: string, at: string): AfterSalesTicket {
  const event = (kind: AfterSalesTicket["events"][number]["kind"], note: string | null) => ({
    id: `${ticket.id}-${Date.parse(at)}`,
    kind,
    note,
    actorName,
    createdAt: at,
  });
  switch (action.kind) {
    case "ACCEPT":
      return { ...ticket, status: "ACCEPTED", appointmentAt: action.appointmentAt, events: [event("ACCEPTED", action.note), ...ticket.events] };
    case "REJECT":
      return { ...ticket, status: "REJECTED", events: [event("REJECTED", action.note), ...ticket.events] };
    case "RECEIVE":
      return {
        ...ticket,
        status: "RECEIVED",
        trackingCode: action.trackingCode ?? ticket.trackingCode,
        events: [event("RECEIVED", action.note), ...ticket.events],
      };
    case "READY":
      return { ...ticket, status: "READY", fee: action.fee, events: [event("READY", action.note), ...ticket.events] };
    case "REQUEST_REFUND":
      return { ...ticket, status: "READY", events: [event("REFUND_REQUESTED", action.note), ...ticket.events] };
    case "DONE":
      return { ...ticket, status: "DONE", events: [event("DONE", action.note), ...ticket.events] };
    case "NOTE":
      return { ...ticket, events: [event("NOTE", action.note), ...ticket.events] };
  }
}
