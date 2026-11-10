import { z } from "zod";
import { ADVANCE_STATUSES } from "../utils/orderFlow";

/** Chuyển đơn sang bước kế — server kiểm tra lại bằng `nextOrderStatus` (không nhảy cóc, không hủy ở đây) */
export const advanceOrderSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(ADVANCE_STATUSES),
});

/** Ghi nhận tiền đã nhận (đối soát chuyển khoản / thu COD tay) — số nguyên VND dương */
export const recordOrderPaymentSchema = z.object({
  orderId: z.uuid(),
  amount: z.number().int().positive().max(1_000_000_000),
  note: z.string().trim().max(200).optional(),
});

/** Tham số `requestOrderApprovalAction` — người gửi lấy từ phiên ở server, không nhận từ client */
export const requestOrderApprovalSchema = z.object({
  orderId: z.uuid(),
  actionType: z.enum(["CANCEL_ORDER", "REFUND", "MANUAL_DISCOUNT"]),
  description: z.string().trim().min(1).max(1000),
  payload: z.record(z.string(), z.unknown()).optional(),
});
