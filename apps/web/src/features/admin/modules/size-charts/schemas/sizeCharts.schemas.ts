import { z } from "zod";
import { MEASUREMENT_KEYS, PRODUCT_GROUPS } from "@repo/shared/sizing";
import { MAX_SIZE_CHART_ROWS } from "../utils/sizeChartPresets";

const measurement = z.number().finite().min(0).max(1000).nullable();
const optionalText = (max: number) => z.string().trim().max(max);

const rangeSchema = z.object({ min: measurement, max: measurement });

const columnSchema = z.object({
  key: z.enum(MEASUREMENT_KEYS),
  validMin: measurement,
  validMax: measurement,
  bigsizeFrom: measurement,
});

const rowSchema = z.object({
  sizeLabel: z.string().trim().min(1, "SIZE_LABEL_REQUIRED").max(20),
  values: z.partialRecord(z.enum(MEASUREMENT_KEYS), rangeSchema),
});

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
    columns: z.array(columnSchema).max(MEASUREMENT_KEYS.length),
    rows: z.array(rowSchema).max(MAX_SIZE_CHART_ROWS),
  })
  .superRefine((data, ctx) => {
    const keys = new Set<string>();
    data.columns.forEach((column, index) => {
      if (keys.has(column.key)) ctx.addIssue({ code: "custom", path: ["columns", index], message: "SIZE_CHART_COLUMN_DUPLICATE" });
      keys.add(column.key);
      if (column.validMin !== null && column.validMax !== null && column.validMin > column.validMax) {
        ctx.addIssue({ code: "custom", path: ["columns", index, "validMax"], message: "SIZE_CHART_RANGE_INVALID" });
      }
    });

    const labels = new Set<string>();
    data.rows.forEach((row, rowIndex) => {
      const label = row.sizeLabel.toUpperCase();
      if (labels.has(label)) ctx.addIssue({ code: "custom", path: ["rows", rowIndex, "sizeLabel"], message: "SIZE_LABEL_DUPLICATE" });
      labels.add(label);

      for (const column of data.columns) {
        const range = row.values[column.key];
        if (!range) continue;
        if (range.min !== null && range.max !== null && range.min > range.max) {
          ctx.addIssue({ code: "custom", path: ["rows", rowIndex, column.key], message: "SIZE_CHART_RANGE_INVALID" });
        }
        const outOfRange = [range.min, range.max].some(
          (value) =>
            value !== null &&
            ((column.validMin !== null && value < column.validMin) || (column.validMax !== null && value > column.validMax))
        );
        if (outOfRange) {
          ctx.addIssue({ code: "custom", path: ["rows", rowIndex, column.key], message: "SIZE_CHART_VALUE_OUT_OF_RANGE" });
        }
      }
    });

    if (data.surchargeType && !(data.surchargeValue && data.surchargeValue > 0)) {
      ctx.addIssue({ code: "custom", path: ["surchargeValue"], message: "SIZE_CHART_SURCHARGE_INVALID" });
    }
    if (data.surchargeType === "PERCENTAGE" && (data.surchargeValue ?? 0) > 100) {
      ctx.addIssue({ code: "custom", path: ["surchargeValue"], message: "SIZE_CHART_SURCHARGE_INVALID" });
    }
  });

export type SaveSizeChartInput = z.input<typeof saveSizeChartSchema>;
