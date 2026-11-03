"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Ruler, Scissors, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import {
  MEASUREMENT_UNITS,
  PRODUCT_GROUP_TRAITS,
  suggestSize,
  validateMeasurements,
  type MeasurementInput,
  type MeasurementKey,
} from "@repo/shared/sizing";
import { cn } from "@/lib/utils";
import { type SizeChartPreviewData } from "../../types/sizeCharts.types";
import { formatRange, parseNumberInput } from "../../utils/sizeChartData";

type Tab = "table" | "finder" | "guide";

// Khách thường chỉ nhớ chiều cao, cân nặng và 3 vòng — các ô khác để trong bảng tham khảo
const FINDER_PRIORITY: readonly MeasurementKey[] = ["height", "weight", "age", "bust", "waist", "hips", "footLength", "thigh"];
const MAX_FINDER_FIELDS = 5;

function finderKeys(chart: SizeChartPreviewData): MeasurementKey[] {
  const keys = chart.columns.map((column) => column.key);
  const prioritized = FINDER_PRIORITY.filter((key) => keys.includes(key));
  return (prioritized.length > 0 ? prioritized : keys).slice(0, MAX_FINDER_FIELDS);
}

/**
 * Widget tư vấn size phía khách: bảng size dạng số (đọc rõ trên điện thoại thay vì ảnh thu nhỏ),
 * "Tìm size vừa với tôi" và hướng dẫn đo. Dùng ở xem trước admin; storefront sẽ dùng lại cùng dữ liệu.
 */
export function SizeAdvisorWidget({ chart }: { chart: SizeChartPreviewData }) {
  const t = useTranslations("AdminPage.sizeCharts.advisor");
  const tSizing = useTranslations("AdminPage.sizing");
  const locale = useLocale() as Locale;
  const [tab, setTab] = useState<Tab>("finder");
  const [selectedSize, setSelectedSize] = useState(chart.rows[0]?.sizeLabel ?? "");
  const [inputs, setInputs] = useState<Partial<Record<MeasurementKey, string>>>({});

  const keys = finderKeys(chart);
  const measurements: MeasurementInput = Object.fromEntries(
    keys.map((key) => [key, parseNumberInput(inputs[key] ?? "")])
  );
  const issues = validateMeasurements(chart, measurements);
  const invalidKeys = new Set(issues.map((issue) => issue.key));
  // Số đo gõ sai thì không đem đi so để tránh gợi ý sai
  const validInput: MeasurementInput = Object.fromEntries(
    Object.entries(measurements).filter(([key]) => !invalidKeys.has(key as MeasurementKey))
  );
  const hasInput = Object.values(validInput).some((value) => typeof value === "number");
  const suggestion = suggestSize(chart, validInput);
  const allowsCustom = PRODUCT_GROUP_TRAITS[chart.group].customMeasurement !== null;
  const label = (key: MeasurementKey) => tSizing(`measurement.${key}`).toLowerCase();
  const joinKeys = (list: MeasurementKey[]) => list.map(label).join(", ");

  const surchargeText =
    chart.surchargeType && chart.surchargeValue
      ? chart.surchargeType === "FIXED_AMOUNT"
        ? `+${formatVnd(chart.surchargeValue, locale)}`
        : `+${chart.surchargeValue}%`
      : null;
  const selectedRow = chart.rows.find((row) => row.sizeLabel === selectedSize) ?? chart.rows[0];

  const tabs: { key: Tab; icon: typeof Ruler }[] = [
    { key: "finder", icon: Sparkles },
    { key: "table", icon: Ruler },
    { key: "guide", icon: Scissors },
  ];

  return (
    <div className="flex h-full flex-col bg-(--bg-main) text-(--text-main)">
      <div className="border-b border-(--border) px-4 pb-3 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-light)">{t("eyebrow")}</p>
        <h3 className="mt-0.5 text-lg font-semibold text-(--heading-color)">{chart.name}</h3>
        <div role="tablist" className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-(--bg-secondary) p-1">
          {tabs.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex cursor-pointer items-center justify-center gap-1 rounded-full py-1.5 text-xs font-medium transition-colors",
                tab === key ? "bg-(--primary-color) text-white" : "text-(--text-light)"
              )}
            >
              <Icon size={13} aria-hidden /> {t(`tab.${key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {chart.rows.length === 0 && tab !== "guide" ? (
          <p className="py-10 text-center text-sm text-(--text-light)">{t("emptyChart")}</p>
        ) : tab === "finder" ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-(--text-light)">{t("finderIntro")}</p>
            <div className="grid grid-cols-2 gap-3">
              {keys.map((key) => {
                const issue = issues.find((item) => item.key === key);
                return (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs font-medium">{tSizing(`measurement.${key}`)}</span>
                    <span
                      className={cn(
                        "flex h-11 items-center rounded-xl border bg-(--bg-card) pr-3",
                        issue ? "border-(--destructive)" : "border-(--border) focus-within:border-(--primary-color)"
                      )}
                    >
                      <input
                        inputMode="decimal"
                        value={inputs[key] ?? ""}
                        onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="h-full min-w-0 flex-1 bg-transparent px-3 text-base tabular-nums outline-none"
                      />
                      <span className="text-xs text-(--text-light)">{tSizing(`unit.${MEASUREMENT_UNITS[key]}`)}</span>
                    </span>
                    {issue && (
                      <span className="mt-1 block text-[11px] leading-snug text-(--destructive)">
                        {t(`issue.${issue.reason}`, { limit: issue.limit, unit: tSizing(`unit.${MEASUREMENT_UNITS[key]}`) })}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {hasInput && (
              <div
                className={cn(
                  "rounded-2xl border p-4",
                  suggestion.status === "FIT"
                    ? "border-(--success)/40 bg-(--success)/5"
                    : suggestion.status === "INSUFFICIENT"
                      ? "border-(--border) bg-(--bg-card)"
                      : "border-(--sale-gold)/50 bg-(--sale-gold)/5"
                )}
              >
                <div className="flex items-start gap-3">
                  {suggestion.status === "FIT" ? (
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-(--success)" aria-hidden />
                  ) : (
                    <AlertTriangle size={20} className="mt-0.5 shrink-0 text-(--sale-gold)" aria-hidden />
                  )}
                  <div className="min-w-0 space-y-1.5 text-sm leading-relaxed">
                    {suggestion.sizeLabel && suggestion.status !== "NO_FIT" && (
                      <p className="text-2xl font-semibold text-(--heading-color)">
                        {t("result.size", { size: suggestion.sizeLabel })}
                      </p>
                    )}
                    <p>
                      {suggestion.status === "FIT" && t("result.fit", { size: suggestion.sizeLabel ?? "" })}
                      {suggestion.status === "TIGHT" &&
                        t(suggestion.nextSizeLabel ? "result.tightWithNext" : "result.tight", {
                          size: suggestion.sizeLabel ?? "",
                          keys: joinKeys(suggestion.tightKeys),
                          next: suggestion.nextSizeLabel ?? "",
                        })}
                      {suggestion.status === "NO_FIT" &&
                        t(allowsCustom ? "result.noFitCustom" : "result.noFit", { size: suggestion.sizeLabel ?? "" })}
                      {suggestion.status === "INSUFFICIENT" && t("result.insufficient")}
                    </p>
                    {suggestion.looseKeys.length > 0 && suggestion.status !== "NO_FIT" && (
                      <p className="text-(--text-light)">{t("result.loose", { keys: joinKeys(suggestion.looseKeys) })}</p>
                    )}
                    {suggestion.bigsizeKeys.length > 0 && allowsCustom && (
                      <p className="rounded-lg bg-(--bg-secondary) px-3 py-2 text-xs">
                        {t("result.bigsize", { keys: joinKeys(suggestion.bigsizeKeys) })}
                        {surchargeText && ` ${t("result.surcharge", { amount: surchargeText })}`}
                        {chart.extraFabric ? ` ${t("result.extraFabric", { meters: chart.extraFabric })}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : tab === "table" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {chart.rows.map((row) => (
                <button
                  key={row.sizeLabel}
                  type="button"
                  aria-pressed={selectedRow?.sizeLabel === row.sizeLabel}
                  onClick={() => setSelectedSize(row.sizeLabel)}
                  className={cn(
                    "h-10 min-w-11 cursor-pointer rounded-full border px-3 text-sm font-semibold transition-colors",
                    selectedRow?.sizeLabel === row.sizeLabel
                      ? "border-(--primary-color) bg-(--primary-color) text-white"
                      : "border-(--border) bg-(--bg-card)"
                  )}
                >
                  {row.sizeLabel}
                </button>
              ))}
            </div>
            {selectedRow && (
              <dl className="divide-y divide-(--border) overflow-hidden rounded-2xl border border-(--border) bg-(--bg-card)">
                {chart.columns.map((column) => (
                  <div key={column.key} className="flex items-center justify-between px-4 py-3">
                    <dt className="text-sm text-(--text-light)">{tSizing(`measurement.${column.key}`)}</dt>
                    <dd className="text-base font-semibold tabular-nums">
                      {formatRange(selectedRow.values[column.key])}{" "}
                      <span className="text-xs font-normal text-(--text-light)">
                        {tSizing(`unit.${MEASUREMENT_UNITS[column.key]}`)}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <details className="rounded-2xl border border-(--border) bg-(--bg-card)">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">{t("fullTable")}</summary>
              <div className="overflow-x-auto border-t border-(--border)">
                <table className="w-full border-collapse text-sm tabular-nums">
                  <thead>
                    <tr className="bg-(--bg-secondary) text-left text-xs">
                      <th className="sticky left-0 bg-(--bg-secondary) px-3 py-2 font-semibold">{t("sizeColumn")}</th>
                      {chart.columns.map((column) => (
                        <th key={column.key} className="whitespace-nowrap px-3 py-2 font-semibold">
                          {tSizing(`measurement.${column.key}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.rows.map((row) => (
                      <tr key={row.sizeLabel} className="border-t border-(--border)">
                        <th className="sticky left-0 bg-(--bg-card) px-3 py-2 text-left font-semibold">{row.sizeLabel}</th>
                        {chart.columns.map((column) => (
                          <td key={column.key} className="whitespace-nowrap px-3 py-2">
                            {formatRange(row.values[column.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        ) : (
          <div className="space-y-4">
            {chart.guideImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh hướng dẫn tải lên Cloudinary/URL tùy ý, chưa khai báo remotePatterns
              <img src={chart.guideImage} alt={t("guideImageAlt")} className="w-full rounded-2xl border border-(--border)" />
            ) : null}
            {chart.measurementGuide ? (
              <p className="whitespace-pre-line text-sm leading-relaxed">{chart.measurementGuide}</p>
            ) : (
              <p className="py-10 text-center text-sm text-(--text-light)">{t("emptyGuide")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
