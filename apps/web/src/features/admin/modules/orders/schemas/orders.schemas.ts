import { z } from "zod";
import { OrderStatus, PaymentStatus } from "@repo/db";

export const updateOrderStatusSchema = z.object({ orderId: z.uuid(), status: z.enum(OrderStatus) });
export const updatePaymentStatusSchema = z.object({ orderId: z.uuid(), paymentStatus: z.enum(PaymentStatus) });

/** Tham số `requestOrderApprovalAction` — người gửi lấy từ phiên ở server, không nhận từ client */
export const requestOrderApprovalSchema = z.object({
  orderId: z.uuid(),
  actionType: z.enum(["CANCEL_ORDER", "REFUND", "MANUAL_DISCOUNT"]),
  description: z.string().trim().min(1).max(1000),
  payload: z.record(z.string(), z.unknown()).optional(),
});
