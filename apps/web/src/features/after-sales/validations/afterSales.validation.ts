import * as z from "zod";
import { AFTER_SALES_DESCRIPTION_MAX, AFTER_SALES_SERVICES, HANDOVER_METHODS } from "../constants/afterSalesOptions";

/** Form yêu cầu sửa đồ / đổi trả. Thông điệp lỗi là mã KEY, dịch qua `Errors` */
export const afterSalesRequestSchema = z.object({
  itemIndex: z.string().min(1, "AFTER_SALES_ITEM_REQUIRED"),
  service: z.enum(AFTER_SALES_SERVICES),
  reason: z.string().min(1, "AFTER_SALES_REASON_REQUIRED"),
  description: z
    .string()
    .trim()
    .min(10, "AFTER_SALES_DESCRIPTION_TOO_SHORT")
    .max(AFTER_SALES_DESCRIPTION_MAX, "AFTER_SALES_DESCRIPTION_TOO_LONG"),
  handover: z.enum(HANDOVER_METHODS),
});
export type AfterSalesRequestInput = z.input<typeof afterSalesRequestSchema>;
export type AfterSalesRequestData = z.output<typeof afterSalesRequestSchema>;
