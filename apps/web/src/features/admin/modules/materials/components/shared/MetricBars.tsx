"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type MaterialMetrics } from "../../types/materials.types";
import { MATERIAL_METRICS, METRIC_LEVELS } from "../../utils/materialMeta";

/**
 * Năm cột đo dựng đứng như thanh âm lượng (giãn · dày · rủ · thấu · bóng) — đọc được "tính cách" tấm vải
 * trong một cái liếc ở thẻ danh sách
 */
export function MetricBars({ metrics, className }: { metrics: MaterialMetrics; className?: string }) {
  const t = useTranslations("AdminPage.materials.metrics");
  return (
    <div className={cn("grid grid-cols-5 gap-1.5", className)}>
      {MATERIAL_METRICS.map((key) => {
        const value = metrics[key];
        return (
          <div key={key} className="flex flex-col items-center gap-1" title={`${t(`${key}.label`)}: ${value ?? "—"}/5`}>
            <div className="flex h-7 w-2.5 flex-col-reverse gap-px">
              {METRIC_LEVELS.map((level) => (
                <span
                  key={level}
                  className={cn("flex-1 rounded-[1px]", value !== null && level <= value ? "bg-[#18181B]" : "bg-[#E4E4E7]")}
                />
              ))}
            </div>
            <span className="text-2xs leading-none text-[#71717A]">{t(`${key}.short`)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Một thanh đo ngang 5 nấc; truyền `onChange` thì bấm được (bấm lại nấc đang chọn để bỏ đánh giá) */
export function MetricScale({
  value,
  onChange,
  label,
  size = "md",
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role={onChange ? "radiogroup" : undefined} aria-label={label} className="flex gap-1">
      {METRIC_LEVELS.map((level) => {
        const filled = value !== null && level <= value;
        const segment = cn(
          "rounded-sm transition-colors",
          size === "sm" ? "h-1.5 w-2.5" : "h-7 flex-1",
          filled ? "bg-[#18181B]" : "bg-[#F4F4F5]"
        );
        if (!onChange) return <span key={level} className={segment} />;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={value === level}
            aria-label={`${level}/5`}
            onClick={() => onChange(value === level ? null : level)}
            className={cn(
              segment,
              "cursor-pointer text-2xs font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]/25",
              filled ? "text-white hover:bg-[#3F3F46]" : "text-[#A1A1AA] hover:bg-[#E4E4E7]"
            )}
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}
