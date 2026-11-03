import { z } from "zod";

/** Ba màn phê duyệt: hàng đợi chờ duyệt, lịch sử đã xử lý (ADMIN) và yêu cầu do chính mình gửi (STAFF) */
export const APPROVAL_VIEWS = ["queue", "history", "mine"] as const;
export type ApprovalView = (typeof APPROVAL_VIEWS)[number];

export const listApprovalsSchema = z.object({
  view: z.enum(APPROVAL_VIEWS),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

/** Tham số `reviewApprovalRequestAction` — người duyệt lấy từ phiên ở server, không nhận từ client */
export const reviewApprovalSchema = z.object({
  requestId: z.uuid(),
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectReason: z.string().trim().max(500).optional(),
});
