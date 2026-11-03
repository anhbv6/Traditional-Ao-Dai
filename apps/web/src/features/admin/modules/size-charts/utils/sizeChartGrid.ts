import { type MeasurementKey, type SizeRange } from "@repo/shared/sizing";
import { type SizeChartColumnValue, type SizeChartRowValue } from "../types/sizeCharts.types";
import { createRowUid } from "./sizeChartPresets";

export type CellIssue = "OUT_OF_RANGE" | "MIN_GT_MAX";

/** Lỗi của một ô — cùng luật với `saveSizeChartSchema` để báo ngay khi nhập */
export function getCellIssue(range: SizeRange | undefined, column: SizeChartColumnValue): CellIssue | null {
  if (!range) return null;
  if (range.min !== null && range.max !== null && range.min > range.max) return "MIN_GT_MAX";
  const outOfRange = [range.min, range.max].some(
    (value) =>
      value !== null &&
      ((column.validMin !== null && value < column.validMin) || (column.validMax !== null && value > column.validMax))
  );
  return outOfRange ? "OUT_OF_RANGE" : null;
}

export interface GridIssues {
  cells: number;
  emptyLabels: number;
  duplicateLabels: Set<string>;
  invalidColumns: Set<MeasurementKey>;
  total: number;
}

/** Tổng hợp lỗi toàn bảng để khóa nút lưu và hiện số lỗi */
export function collectGridIssues(columns: SizeChartColumnValue[], rows: SizeChartRowValue[]): GridIssues {
  let cells = 0;
  let emptyLabels = 0;
  const seen = new Set<string>();
  const duplicateLabels = new Set<string>();
  for (const row of rows) {
    const label = row.sizeLabel.trim().toUpperCase();
    if (!label) emptyLabels++;
    else if (seen.has(label)) duplicateLabels.add(label);
    seen.add(label);
    for (const column of columns) if (getCellIssue(row.values[column.key], column)) cells++;
  }
  const invalidColumns = new Set(
    columns
      .filter((column) => column.validMin !== null && column.validMax !== null && column.validMin > column.validMax)
      .map((column) => column.key)
  );
  return {
    cells,
    emptyLabels,
    duplicateLabels,
    invalidColumns,
    total: cells + emptyLabels + duplicateLabels.size + invalidColumns.size,
  };
}

const step = (last: number | null, prev: number | null) =>
  last !== null && prev !== null ? Math.round((last + (last - prev)) * 10) / 10 : null;

/**
 * Hàng mới: nếu đã có ≥ 2 hàng thì nội suy theo bước nhảy của 2 hàng cuối (S→M tăng 4cm thì L tăng tiếp 4cm),
 * admin chỉ cần sửa lại vài ô thay vì gõ cả hàng.
 */
export function createNextRow(columns: SizeChartColumnValue[], rows: SizeChartRowValue[], sizeLabel: string): SizeChartRowValue {
  const last = rows.at(-1);
  const prev = rows.at(-2);
  const values: SizeChartRowValue["values"] = {};
  if (last && prev) {
    for (const { key } of columns) {
      const a = last.values[key];
      const b = prev.values[key];
      if (!a) continue;
      values[key] = { min: step(a.min, b?.min ?? null), max: step(a.max, b?.max ?? null) };
    }
  }
  return { uid: createRowUid(), sizeLabel, values };
}

/** Đọc một ô dán từ Excel/Google Sheets: "82-86", "82 – 86", "82,5" hoặc "82" (min = max) */
export function parsePastedRange(text: string): SizeRange | null {
  const cleaned = text.trim().replace(/,/g, ".");
  if (!cleaned) return { min: null, max: null };
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*(?:[-–~]\s*(\d+(?:\.\d+)?))?$/);
  if (!match) return null;
  const min = Number(match[1]);
  const max = match[2] !== undefined ? Number(match[2]) : min;
  return { min, max };
}

/**
 * Dán một vùng ô (TSV từ Excel) bắt đầu tại hàng `rowIndex`, cột `columnIndex` (-1 = cột ký hiệu size).
 * Thiếu hàng thì tự thêm hàng mới.
 */
export function applyPastedGrid(
  text: string,
  columns: SizeChartColumnValue[],
  rows: SizeChartRowValue[],
  rowIndex: number,
  columnIndex: number,
  maxRows: number
): SizeChartRowValue[] {
  const lines = text.replace(/\r/g, "").split("\n");
  if (lines.at(-1) === "") lines.pop();
  const next = rows.map((row) => ({ ...row, values: { ...row.values } }));

  lines.forEach((line, lineOffset) => {
    const targetRow = rowIndex + lineOffset;
    if (targetRow >= maxRows) return;
    if (!next[targetRow]) next[targetRow] = { uid: createRowUid(), sizeLabel: "", values: {} };
    const row = next[targetRow];
    line.split("\t").forEach((cell, cellOffset) => {
      const target = columnIndex + cellOffset;
      if (target === -1) {
        row.sizeLabel = cell.trim().slice(0, 20);
        return;
      }
      const column = columns[target];
      const range = column ? parsePastedRange(cell) : null;
      if (column && range) row.values[column.key] = range;
    });
  });
  return next;
}
