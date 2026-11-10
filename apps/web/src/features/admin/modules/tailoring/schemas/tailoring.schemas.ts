import { z } from "zod";

/** Tham số `updateTailoringStatusAction` — thợ thực hiện lấy từ phiên ở server; đơn suy ra từ món, không nhận từ client */
export const updateTailoringStatusSchema = z.object({
  orderItemId: z.uuid(),
  status: z.enum(["WAITING_FABRIC", "FABRIC_CUTTING", "SEWING", "EMBROIDERY_BEADING", "FITTING_IRONING", "COMPLETED"]),
  note: z.string().trim().max(500).optional(),
});
