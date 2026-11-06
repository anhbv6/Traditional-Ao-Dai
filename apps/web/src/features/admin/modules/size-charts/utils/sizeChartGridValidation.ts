import { z } from "zod";
import { MEASUREMENT_KEYS } from "@repo/shared/sizing";
import { MAX_SIZE_CHART_ROWS } from "./sizeChartPresets";

/*
 * Kiểm tra lưới bảng size (cột thông số + hàng size) — dùng chung cho "Lưu bảng size" và "Thêm loại sản phẩm kèm bảng size
 * riêng" nên nằm ở utils (export qua index), không phải schema nội bộ của một Server Action.
 */

const measurement = z.number().finite().min(0).max(1000).nullable();

const rangeSchema = z.object({ min: measurement, max: measurement });

export const sizeChartColumnSchema = z.object({
  key: z.enum(MEASUREMENT_KEYS),
  validMin: measurement,
  validMax: measurement,
  bigsizeFrom: measurement,
});

export const sizeChartRowSchema = z.object({
  sizeLabel: z.string().trim().min(1, "SIZE_LABEL_REQUIRED").max(20),
  values: z.partialRecord(z.enum(MEASUREMENT_KEYS), rangeSchema),
});

export const sizeChartGridFields = {
  columns: z.array(sizeChartColumnSchema).max(MEASUREMENT_KEYS.length),
  rows: z.array(sizeChartRowSchema).max(MAX_SIZE_CHART_ROWS),
};

type GridData = {
  columns: z.infer<typeof sizeChartColumnSchema>[];
  rows: z.infer<typeof sizeChartRowSchema>[];
};

/** Kiểm tra chéo: không trùng cột / ký hiệu size, min ≤ max, số nằm trong ngưỡng hợp lệ của cột */
export function refineSizeChartGrid(data: GridData, ctx: z.RefinementCtx) {
  const keys = new Set<string>();
  data.columns.forEach((column, index) => {
    if (keys.has(column.key))
      ctx.addIssue({ code: "custom", path: ["columns", index], message: "SIZE_CHART_COLUMN_DUPLICATE" });
    keys.add(column.key);
    if (column.validMin !== null && column.validMax !== null && column.validMin > column.validMax) {
      ctx.addIssue({ code: "custom", path: ["columns", index, "validMax"], message: "SIZE_CHART_RANGE_INVALID" });
    }
  });

  const labels = new Set<string>();
  data.rows.forEach((row, rowIndex) => {
    const label = row.sizeLabel.toUpperCase();
    if (labels.has(label))
      ctx.addIssue({ code: "custom", path: ["rows", rowIndex, "sizeLabel"], message: "SIZE_LABEL_DUPLICATE" });
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
          ((column.validMin !== null && value < column.validMin) ||
            (column.validMax !== null && value > column.validMax))
      );
      if (outOfRange) {
        ctx.addIssue({
          code: "custom",
          path: ["rows", rowIndex, column.key],
          message: "SIZE_CHART_VALUE_OUT_OF_RANGE",
        });
      }
    }
  });
}

/** Lưới bảng size đầy đủ (dùng khi nhận bảng size kèm một thao tác khác, VD thêm loại sản phẩm) */
export const sizeChartGridSchema = z.object(sizeChartGridFields).superRefine(refineSizeChartGrid);
export type SizeChartGridInput = z.input<typeof sizeChartGridSchema>;

/** Hàng size có ít nhất một số đo — bảng "đã nhập" khi mọi hàng đều có số */
export const rowHasMeasurement = (row: {
  values: Partial<Record<string, { min: number | null; max: number | null }>>;
}) => Object.values(row.values).some((range) => range && (range.min !== null || range.max !== null));
