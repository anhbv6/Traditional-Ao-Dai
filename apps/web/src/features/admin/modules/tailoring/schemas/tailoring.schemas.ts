import { z } from "zod";
import { TailoringStatus } from "@repo/db";

/** Tham số `updateTailoringStatusAction` — thợ thực hiện lấy từ phiên ở server, không nhận từ client */
export const updateTailoringStatusSchema = z.object({
  orderItemId: z.uuid(),
  orderId: z.uuid(),
  status: z.enum(TailoringStatus),
  note: z.string().trim().max(500).optional(),
});
