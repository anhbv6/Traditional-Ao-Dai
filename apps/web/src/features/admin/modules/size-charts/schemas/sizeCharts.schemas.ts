import { z } from "zod";
import { PRODUCT_GROUPS } from "@repo/shared/sizing";
import { refineSizeChartGrid, sizeChartGridFields } from "../utils/sizeChartGridValidation";

const optionalText = (max: number) => z.string().trim().max(max);

export const sizeChartIdSchema = z.object({ sizeChartId: z.uuid() });

export const toggleSizeChartSchema = z.object({ sizeChartId: z.uuid(), isActive: z.boolean() });

/** Thông tin bảng size (không gồm lưới số đo) — dùng chung cho dialog tạo và sửa */
const sizeChartInfoFields = z.object({
  name: z.string().trim().min(1, "SIZE_CHART_NAME_REQUIRED").max(120),
  nameEn: optionalText(120),
  group: z.enum(PRODUCT_GROUPS),
  description: optionalText(1000),
  descriptionEn: optionalText(1000),
  measurementGuide: optionalText(5000),
  measurementGuideEn: optionalText(5000),
  guideImage: z.string().regex(/^((https:\/\/|\/).*)?$/, "VALIDATION_ERROR"),
  surchargeType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).nullable(),
  surchargeValue: z.number().finite().min(0).max(100_000_000).nullable(),
  extraFabric: z.number().finite().min(0).max(10).nullable(),
});

/** Phụ phí bigsize hợp lý: có kiểu thì phải > 0, phần trăm tối đa 100 */
function refineSurcharge(
  data: Pick<z.infer<typeof sizeChartInfoFields>, "surchargeType" | "surchargeValue">,
  ctx: z.RefinementCtx
) {
  if (data.surchargeType && !(data.surchargeValue && data.surchargeValue > 0)) {
    ctx.addIssue({ code: "custom", path: ["surchargeValue"], message: "SIZE_CHART_SURCHARGE_INVALID" });
  }
  if (data.surchargeType === "PERCENTAGE" && (data.surchargeValue ?? 0) > 100) {
    ctx.addIssue({ code: "custom", path: ["surchargeValue"], message: "SIZE_CHART_SURCHARGE_INVALID" });
  }
}

/** Tạo bảng size: đủ thông tin, lưới khởi đầu theo nhóm hàng do server dựng; bảng mới luôn chưa áp dụng */
export const createSizeChartSchema = sizeChartInfoFields.superRefine(refineSurcharge);

/** Sửa thông tin bảng size (dialog) — lưới số đo lưu riêng */
export const updateSizeChartInfoSchema = sizeChartInfoFields
  .extend({ sizeChartId: z.uuid(), isActive: z.boolean() })
  .superRefine(refineSurcharge);

/** Lưu lưới số đo (cột + hàng). Kiểm tra chéo: không trùng cột / ký hiệu, min ≤ max, số nằm trong ngưỡng hợp lệ */
export const saveSizeChartGridSchema = z
  .object({ sizeChartId: z.uuid(), ...sizeChartGridFields })
  .superRefine(refineSizeChartGrid);

export type SizeChartInfoInput = z.input<typeof createSizeChartSchema>;
