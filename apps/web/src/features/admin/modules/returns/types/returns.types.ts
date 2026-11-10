import { type AfterSalesService, type HandoverMethod } from "@/features/after-sales";

export type { AfterSalesService, HandoverMethod };

/**
 * Trạng thái phiếu hậu mãi — đi theo chiếc áo:
 * NEW khách vừa gửi → ACCEPTED tiệm đã tiếp nhận, chờ áo tới → RECEIVED áo đã ở tiệm, đang xử lý →
 * READY xong (sửa / đổi xong chờ trả khách, hoặc trả hàng đang chờ hoàn tiền) → DONE đã trả áo / đã hoàn tiền.
 * REJECTED: từ chối (quá hạn, không thuộc phạm vi...) kèm lý do.
 */
export const TICKET_STATUSES = ["NEW", "ACCEPTED", "RECEIVED", "READY", "DONE", "REJECTED"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export type TicketEventKind = "SUBMITTED" | "ACCEPTED" | "REJECTED" | "RECEIVED" | "READY" | "REFUND_REQUESTED" | "DONE" | "NOTE";

export interface TicketEvent {
  id: string;
  kind: TicketEventKind;
  note: string | null;
  actorName: string;
  createdAt: string;
}

export interface AfterSalesTicket {
  id: string;
  /** Mã phiếu khách nhận khi gửi, VD "RQ-7K2QAB" */
  code: string;
  service: AfterSalesService;
  /** Mã lý do theo loại (AFTER_SALES_REASONS) */
  reason: string;
  description: string;
  status: TicketStatus;
  orderCode: string;
  productName: string;
  variantName: string | null;
  image: string | null;
  /** Áo may đo theo số đo riêng — chỉ sửa / bảo hành, không đổi trả */
  isCustomFit: boolean;
  /** Giá món (VND) — để biết số tiền hoàn khi trả hàng */
  itemPrice: number;
  customerName: string;
  customerPhone: string;
  handover: HandoverMethod;
  /** Mã vận đơn khi khách gửi bưu điện */
  trackingCode: string | null;
  /** Hẹn khách mang áo tới / hẹn trả áo */
  appointmentAt: string | null;
  /** Phí sửa ngoài chính sách (VND) — 0 = miễn phí */
  fee: number;
  photoCount: number;
  deliveredAt: string;
  createdAt: string;
  events: TicketEvent[];
}

export interface ReturnsDeskData {
  tickets: AfterSalesTicket[];
  now: string;
}

/** Thao tác trên phiếu từ bàn tiếp nhận */
export type TicketAction =
  | { kind: "ACCEPT"; appointmentAt: string | null; note: string | null }
  | { kind: "REJECT"; note: string }
  | { kind: "RECEIVE"; trackingCode: string | null; note: string | null }
  | { kind: "READY"; fee: number; note: string | null }
  | { kind: "REQUEST_REFUND"; note: string | null }
  | { kind: "DONE"; note: string | null }
  | { kind: "NOTE"; note: string };
