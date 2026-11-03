"use client";

import { useState, type ClipboardEvent, type InputHTMLAttributes } from "react";
import { ArrowDown, ArrowUp, ClipboardPaste, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  MEASUREMENT_KEYS,
  MEASUREMENT_UNITS,
  PRODUCT_GROUP_TRAITS,
  type MeasurementKey,
  type ProductGroup,
  type SizeRange,
} from "@repo/shared/sizing";
import { cn } from "@/lib/utils";
import { type SizeChartColumnValue, type SizeChartRowValue } from "../../types/sizeCharts.types";
import { parseNumberInput } from "../../utils/sizeChartData";
import { applyPastedGrid, createNextRow, getCellIssue, type GridIssues } from "../../utils/sizeChartGrid";
import { DEFAULT_VALID_RANGE, MAX_SIZE_CHART_ROWS, SIZE_LABEL_PRESETS, nextSizeLabel } from "../../utils/sizeChartPresets";

const NUMBER_CLASS =
  "h-8 w-full min-w-0 rounded-md border bg-white px-1.5 text-center text-sm tabular-nums text-[#09090B] outline-none placeholder:text-[#D4D4D8] focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/10";

interface SizeChartGridProps {
  group: ProductGroup;
  columns: SizeChartColumnValue[];
  rows: SizeChartRowValue[];
  issues: GridIssues;
  onColumnsChange: (columns: SizeChartColumnValue[]) => void;
  onRowsChange: (rows: SizeChartRowValue[]) => void;
}

/**
 * Lưới nhập bảng size kiểu bảng tính: hàng = ký hiệu size, cột = thông số đo, mỗi ô là khoảng min–max.
 * Dán được vùng ô từ Excel/Google Sheets; hai hàng cuối bảng là ngưỡng hợp lệ và ngưỡng bigsize của từng cột.
 */
export function SizeChartGrid({ group, columns, rows, issues, onColumnsChange, onRowsChange }: SizeChartGridProps) {
  const t = useTranslations("AdminPage.sizeCharts.grid");
  const tSizing = useTranslations("AdminPage.sizing");
  const suggested = new Set<MeasurementKey>(PRODUCT_GROUP_TRAITS[group].suggestedKeys);
  const selected = new Set(columns.map((column) => column.key));
  const listId = `size-labels-${group}`;

  const toggleColumn = (key: MeasurementKey) => {
    if (selected.has(key)) {
      onColumnsChange(columns.filter((column) => column.key !== key));
      return;
    }
    // Giữ thứ tự cột theo thứ tự chuẩn của MEASUREMENT_KEYS để bảng nào cũng đọc giống nhau
    const added = [...columns, { key, validMin: DEFAULT_VALID_RANGE[key][0], validMax: DEFAULT_VALID_RANGE[key][1], bigsizeFrom: null }];
    onColumnsChange(added.sort((a, b) => MEASUREMENT_KEYS.indexOf(a.key) - MEASUREMENT_KEYS.indexOf(b.key)));
  };

  const updateColumn = (key: MeasurementKey, patch: Partial<SizeChartColumnValue>) =>
    onColumnsChange(columns.map((column) => (column.key === key ? { ...column, ...patch } : column)));

  const updateRow = (uid: string, patch: Partial<SizeChartRowValue>) =>
    onRowsChange(rows.map((row) => (row.uid === uid ? { ...row, ...patch } : row)));

  const updateCell = (row: SizeChartRowValue, key: MeasurementKey, bound: keyof SizeRange, value: number | null) => {
    const current = row.values[key] ?? { min: null, max: null };
    updateRow(row.uid, { values: { ...row.values, [key]: { ...current, [bound]: value } } });
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onRowsChange(next);
  };

  const addRow = () => {
    if (rows.length >= MAX_SIZE_CHART_ROWS) return;
    onRowsChange([...rows, createNextRow(columns, rows, nextSizeLabel(group, rows.map((row) => row.sizeLabel)))]);
  };

  /** Chỉ chặn dán mặc định khi dữ liệu là vùng nhiều ô (có tab/xuống dòng) */
  const handlePaste = (event: ClipboardEvent<HTMLInputElement>, rowIndex: number, columnIndex: number) => {
    const text = event.clipboardData.getData("text/plain");
    if (!/[\t\n]/.test(text.trim())) return;
    event.preventDefault();
    onRowsChange(applyPastedGrid(text, columns, rows, rowIndex, columnIndex, MAX_SIZE_CHART_ROWS));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium text-[#3F3F46]">{t("pickColumns")}</p>
        <div className="flex flex-wrap gap-1.5">
          {MEASUREMENT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={selected.has(key)}
              onClick={() => toggleColumn(key)}
              className={cn(
                "inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors",
                selected.has(key)
                  ? "border-[#18181B] bg-[#18181B] text-white"
                  : "border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#A1A1AA]"
              )}
            >
              {selected.has(key) ? <X size={12} aria-hidden /> : <Plus size={12} aria-hidden />}
              {tSizing(`measurement.${key}`)}
              {!selected.has(key) && suggested.has(key) && (
                <span className="size-1.5 rounded-full bg-amber-500" aria-label={t("suggested")} />
              )}
            </button>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#71717A]">
          <span className="size-1.5 rounded-full bg-amber-500" aria-hidden /> {t("suggestedHint")}
        </p>
      </div>

      {columns.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#E4E4E7] py-10 text-center text-sm text-[#71717A]">
          {t("noColumns")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E4E4E7]">
          <datalist id={listId}>
            {SIZE_LABEL_PRESETS[group].map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
          <table className="w-full border-collapse text-sm" style={{ minWidth: 140 + columns.length * 132 + 96 }}>
            <thead>
              <tr className="bg-[#FAFAFA] text-left text-xs text-[#71717A]">
                <th className="sticky left-0 z-10 w-28 border-b border-r border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2 font-semibold uppercase tracking-[0.5px]">
                  {t("sizeColumn")}
                </th>
                {columns.map((column) => (
                  <th key={column.key} className="border-b border-r border-[#E4E4E7] px-2 py-2 font-medium">
                    <span className="block text-[13px] font-semibold text-[#09090B]">{tSizing(`measurement.${column.key}`)}</span>
                    <span className="text-[11px]">
                      {t("rangeHeader", { unit: tSizing(`unit.${MEASUREMENT_UNITS[column.key]}`) })}
                    </span>
                  </th>
                ))}
                <th className="w-24 border-b border-[#E4E4E7] px-2 py-2" aria-label={t("rowActions")} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const label = row.sizeLabel.trim().toUpperCase();
                const labelInvalid = !label || issues.duplicateLabels.has(label);
                return (
                  <tr key={row.uid} className="group/row hover:bg-[#FAFAFA]">
                    <td className="sticky left-0 z-10 border-b border-r border-[#E4E4E7] bg-white px-2 py-1.5 group-hover/row:bg-[#FAFAFA]">
                      <input
                        list={listId}
                        value={row.sizeLabel}
                        maxLength={20}
                        onChange={(e) => updateRow(row.uid, { sizeLabel: e.target.value })}
                        onPaste={(e) => handlePaste(e, rowIndex, -1)}
                        aria-label={t("sizeLabelAria", { index: rowIndex + 1 })}
                        aria-invalid={labelInvalid}
                        placeholder="M"
                        className={cn(
                          NUMBER_CLASS,
                          "font-mono font-semibold",
                          labelInvalid ? "border-rose-400 bg-rose-50" : "border-[#E4E4E7]"
                        )}
                      />
                    </td>
                    {columns.map((column, columnIndex) => {
                      const range = row.values[column.key];
                      const issue = getCellIssue(range, column);
                      return (
                        <td
                          key={column.key}
                          className="border-b border-r border-[#E4E4E7] px-2 py-1.5"
                          title={issue ? t(`issue.${issue}`, { min: column.validMin ?? "–", max: column.validMax ?? "–" }) : undefined}
                        >
                          <div className="flex items-center gap-1">
                            {(["min", "max"] as const).map((bound, boundIndex) => (
                              <span key={bound} className="contents">
                                {boundIndex === 1 && <span className="text-[#A1A1AA]">–</span>}
                                <NumberCell
                                  value={range?.[bound] ?? null}
                                  onValueChange={(value) => updateCell(row, column.key, bound, value)}
                                  onPaste={(e) => handlePaste(e, rowIndex, columnIndex)}
                                  aria-label={`${row.sizeLabel || rowIndex + 1} · ${tSizing(`measurement.${column.key}`)} ${t(bound)}`}
                                  aria-invalid={issue !== null}
                                  placeholder={t(bound)}
                                  className={cn(NUMBER_CLASS, issue ? "border-rose-400 bg-rose-50 text-rose-700" : "border-[#E4E4E7]")}
                                />
                              </span>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                    <td className="border-b border-[#E4E4E7] px-1 py-1.5">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => moveRow(rowIndex, -1)}
                          disabled={rowIndex === 0}
                          aria-label={t("moveUp")}
                          className="grid size-7 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] disabled:cursor-default disabled:opacity-30"
                        >
                          <ArrowUp size={14} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRow(rowIndex, 1)}
                          disabled={rowIndex === rows.length - 1}
                          aria-label={t("moveDown")}
                          className="grid size-7 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] disabled:cursor-default disabled:opacity-30"
                        >
                          <ArrowDown size={14} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRowsChange(rows.filter((r) => r.uid !== row.uid))}
                          aria-label={t("deleteRow", { size: row.sizeLabel || rowIndex + 1 })}
                          className="grid size-7 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-[#FAFAFA] text-xs">
              <tr>
                <th className="sticky left-0 z-10 border-b border-r border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2 text-left font-medium text-[#3F3F46]">
                  {t("validRange")}
                </th>
                {columns.map((column) => (
                  <td key={column.key} className="border-b border-r border-[#E4E4E7] px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <NumberCell
                        value={column.validMin}
                        onValueChange={(value) => updateColumn(column.key, { validMin: value })}
                        aria-label={`${tSizing(`measurement.${column.key}`)} ${t("validMin")}`}
                        className={cn(NUMBER_CLASS, issues.invalidColumns.has(column.key) ? "border-rose-400" : "border-[#E4E4E7]")}
                      />
                      <span className="text-[#A1A1AA]">–</span>
                      <NumberCell
                        value={column.validMax}
                        onValueChange={(value) => updateColumn(column.key, { validMax: value })}
                        aria-label={`${tSizing(`measurement.${column.key}`)} ${t("validMax")}`}
                        className={cn(NUMBER_CLASS, issues.invalidColumns.has(column.key) ? "border-rose-400" : "border-[#E4E4E7]")}
                      />
                    </div>
                  </td>
                ))}
                <td className="border-b border-[#E4E4E7]" />
              </tr>
              <tr>
                <th className="sticky left-0 z-10 border-r border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2 text-left font-medium text-[#3F3F46]">
                  {t("bigsizeFrom")}
                </th>
                {columns.map((column) => (
                  <td key={column.key} className="border-r border-[#E4E4E7] px-2 py-1.5">
                    <NumberCell
                      value={column.bigsizeFrom}
                      onValueChange={(value) => updateColumn(column.key, { bigsizeFrom: value })}
                      aria-label={`${tSizing(`measurement.${column.key}`)} ${t("bigsizeFrom")}`}
                      placeholder={t("bigsizeNone")}
                      className={cn(NUMBER_CLASS, "border-[#E4E4E7]")}
                    />
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          disabled={columns.length === 0 || rows.length >= MAX_SIZE_CHART_ROWS}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[#A1A1AA] px-3.5 text-sm font-medium text-[#3F3F46] transition-colors hover:border-[#18181B] hover:text-[#09090B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} aria-hidden /> {t("addRow")}
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-[#71717A]">
          <ClipboardPaste size={13} aria-hidden /> {t("pasteHint")}
        </span>
      </div>
    </div>
  );
}

/**
 * Ô nhập số giữ chuỗi đang gõ khi focus (cho phép "82." hoặc "82,5" dở dang), rời ô thì hiển thị lại số đã chuẩn hóa
 */
function NumberCell({
  value,
  onValueChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      {...props}
      inputMode="decimal"
      value={draft ?? (value === null ? "" : String(value))}
      onChange={(e) => {
        setDraft(e.target.value);
        onValueChange(parseNumberInput(e.target.value));
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
