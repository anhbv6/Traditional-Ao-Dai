import { isMeasurementKey, type MeasurementKey, type SizeRange } from "@repo/shared/sizing";
import { type AdminSizeChartDetail, type SizeChartPreviewData } from "../types/sizeCharts.types";

const toNumberOrNull = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

/** Đọc cột JSON `SizeChartRow.values` — dữ liệu từ DB vẫn kiểm tra lại vì kiểu Json không có cấu trúc */
export function parseRowValues(json: unknown): Partial<Record<MeasurementKey, SizeRange>> {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  const result: Partial<Record<MeasurementKey, SizeRange>> = {};
  for (const [key, raw] of Object.entries(json)) {
    if (!isMeasurementKey(key) || !raw || typeof raw !== "object") continue;
    const range = raw as Record<string, unknown>;
    result[key] = { min: toNumberOrNull(range.min), max: toNumberOrNull(range.max) };
  }
  return result;
}

/** Hiển thị một khoảng số đo: "82–86", "≥ 100", "≤ 60" hoặc "—" */
export function formatRange(range: SizeRange | undefined): string {
  if (!range || (range.min === null && range.max === null)) return "—";
  if (range.min !== null && range.max !== null) return range.min === range.max ? `${range.min}` : `${range.min}–${range.max}`;
  return range.min !== null ? `≥ ${range.min}` : `≤ ${range.max}`;
}

/** Ô nhập số: chuỗi rỗng → null, chấp nhận dấu phẩy thập phân kiểu Việt Nam */
export function parseNumberInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Rút gọn dữ liệu trình soạn thành dữ liệu widget tư vấn size (dùng chung cho xem trước và storefront sau này) */
export function toPreviewData(
  chart: Pick<
    AdminSizeChartDetail,
    "name" | "group" | "measurementGuide" | "guideImage" | "surchargeType" | "surchargeValue" | "extraFabric" | "columns" | "rows"
  >
): SizeChartPreviewData {
  return {
    name: chart.name,
    group: chart.group,
    measurementGuide: chart.measurementGuide,
    guideImage: chart.guideImage,
    surchargeType: chart.surchargeType,
    surchargeValue: chart.surchargeValue,
    extraFabric: chart.extraFabric,
    columns: chart.columns,
    rows: chart.rows
      .filter((row) => row.sizeLabel.trim())
      .map((row) => ({ sizeLabel: row.sizeLabel.trim(), values: row.values })),
  };
}
