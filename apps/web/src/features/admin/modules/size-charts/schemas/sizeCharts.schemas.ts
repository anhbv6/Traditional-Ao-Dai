import { z } from "zod";
import { PRODUCT_GROUPS } from "@repo/shared/sizing";
import { refineSizeChartGrid, sizeChartGridFields } from "../utils/sizeChartGridValidation";

const optionalText = (max: number) => z.string().trim().max(max);

export const sizeChartIdSchema = z.object({ sizeChartId: z.uuid() });

export const createSizeChartSchema = z.object({
  name: z.string().trim().min(1, "SIZE_CHART_NAME_REQUIRED").max(120),
  group: z.enum(PRODUCT_GROUPS),
});

export const toggleSizeChartSchema = z.object({ sizeChartId: z.uuid(), isActive: z.boolean() });

/**
 * Lưu toàn bộ bảng size. Kiểm tra chéo: không trùng cột/ký hiệu, min ≤ max, số trong bảng nằm trong ngưỡng hợp lệ
 * của cột, phụ phí bigsize hợp lý (phần trăm ≤ 100).
 */
export const saveSizeChartSchema = z
  .object({
    sizeChartId: z.uuid(),
    name: z.string().trim().min(1, "SIZE_CHART_NAME_REQUIRED").max(120),
    nameEn: optionalText(120),
    group: z.enum(PRODUCT_GROUPS),
    description: optionalText(1000),
    descriptionEn: optionalText(1000),
    measurementGuide: optionalText(5000),
    measurementGuideEn: optionalText(5000),
    guideImage: z.string().regex(/^((https:\/\/|\/).*)?$/, "VALIDATION_ERROR"),
    isActive: z.boolean(),
    surchargeType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).nullable(),
    surchargeValue: z.number().finite().min(0).max(100_000_000).nullable(),
    extraFabric: z.number().finite().min(0).max(10).nullable(),
    ...sizeChartGridFields,
  })
  .superRefine((data, ctx) => {
    refineSizeChartGrid(data, ctx);

    if (data.surchargeType && !(data.surchargeValue && data.surchargeValue > 0)) {
      ctx.addIssue({ code: "custom", path: ["surchargeValue"], message: "SIZE_CHART_SURCHARGE_INVALID" });
    }
    if (data.surchargeType === "PERCENTAGE" && (data.surchargeValue ?? 0) > 100) {
      ctx.addIssue({ code: "custom", path: ["surchargeValue"], message: "SIZE_CHART_SURCHARGE_INVALID" });
    }
  });

export type SaveSizeChartInput = z.input<typeof saveSizeChartSchema>;
