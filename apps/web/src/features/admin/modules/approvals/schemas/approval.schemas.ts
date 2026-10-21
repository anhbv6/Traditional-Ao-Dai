import { z } from "zod";

/** Tham số `reviewApprovalRequestAction` — người duyệt lấy từ phiên ở server, không nhận từ client */
export const reviewApprovalSchema = z.object({
  requestId: z.uuid(),
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectReason: z.string().trim().max(500).optional(),
});
