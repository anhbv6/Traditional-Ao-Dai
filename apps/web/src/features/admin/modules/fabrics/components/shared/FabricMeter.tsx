"use client";

import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type FabricStockStatus } from "../../types/fabrics.types";

const FILL_CLASS: Record<FabricStockStatus, string> = {
  OK: "bg-[#3F3F46]",
  LOW: "bg-amber-500",
  OUT: "bg-rose-500",
  INACTIVE: "bg-[#D4D4D8]",
};

/**
 * Thước vải: số mét còn lại + thanh so với lúc nhập cây. Vạch chia mỗi mét (hoặc 5 mét khi cây dài) như thước dây,
 * vạch đứng đánh dấu ngưỡng cảnh báo.
 */
export function FabricMeter({
  remaining,
  received,
  threshold,
  status,
  tops,
  className,
}: {
  remaining: number;
  received: number;
  threshold: number;
  status: FabricStockStatus;
  /** Số thân áo còn cắt được — null khi chất liệu chưa có định mức */
  tops?: number | null;
  className?: string;
}) {
  const t = useTranslations("AdminPage.fabrics");
  const format = useFormatter();
  const scale = Math.max(received, remaining, threshold, 1);
  const percent = (value: number) => `${Math.min(100, Math.max(0, (value / scale) * 100))}%`;
  const step = scale > 40 ? 5 : 1;
  const meters = (value: number) => format.number(value, { maximumFractionDigits: 2 });

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="whitespace-nowrap">
          <span className={cn("font-mono text-body font-semibold tabular-nums", status === "OUT" ? "text-rose-600" : "text-[#09090B]")}>
            {meters(remaining)}
          </span>
          <span className="ml-1 text-xs text-[#71717A]">{t("meterOf", { total: meters(received) })}</span>
        </p>
        {tops !== undefined && (
          <span className="whitespace-nowrap text-xs tabular-nums text-[#71717A]">
            {tops === null ? t("noYield") : t("topsLeft", { count: tops })}
          </span>
        )}
      </div>

      <div className="relative mt-2" role="presentation">
        <div className="h-1.5 overflow-hidden rounded-full bg-[#F4F4F5]">
          <div className={cn("h-full rounded-full transition-[width] duration-500", FILL_CLASS[status])} style={{ width: percent(remaining) }} />
        </div>
        {/* Vạch ngưỡng */}
        <span
          aria-hidden
          className="absolute -top-1 h-3.5 w-px bg-[#71717A]"
          style={{ left: percent(threshold) }}
        />
        {/* Vạch chia như thước dây */}
        <div
          aria-hidden
          className="mt-1 h-1"
          style={{
            backgroundImage: `repeating-linear-gradient(to right, #D4D4D8 0 1px, transparent 1px ${(step / scale) * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}
