"use client";

import { useRef, useState } from "react";
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
 * Hỗ trợ chế độ tương tác (interactive): kéo mốc ngưỡng cảnh báo và hiển thị tooltip chi tiết khi hover.
 */
export function FabricMeter({
  remaining,
  received,
  threshold,
  status,
  tops,
  className,
  interactive = false,
  onThresholdChange,
  showTooltip = false,
}: {
  remaining: number;
  received: number;
  threshold: number;
  status: FabricStockStatus;
  /** Số thân áo còn cắt được — null khi chất liệu chưa có định mức */
  tops?: number | null;
  className?: string;
  /** Cho phép click / kéo mốc để chỉnh ngưỡng cảnh báo */
  interactive?: boolean;
  onThresholdChange?: (newThreshold: number) => void;
  /** Hiện tooltip thông tin khi hover */
  showTooltip?: boolean;
}) {
  const t = useTranslations("AdminPage.fabrics");
  const format = useFormatter();

  const meterRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const scale = Math.max(received, remaining, threshold, 1);
  const percent = (value: number) => `${Math.min(100, Math.max(0, (value / scale) * 100))}%`;
  const step = scale > 40 ? 5 : 1;
  const meters = (value: number) => format.number(value, { maximumFractionDigits: 2 });

  const updateThresholdFromPointer = (clientX: number) => {
    if (!meterRef.current || !onThresholdChange) return;
    const rect = meterRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = ratio * scale;
    // Làm tròn 1 chữ số thập phân
    const rounded = Math.round(rawValue * 10) / 10;
    onThresholdChange(rounded);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !onThresholdChange) return;
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateThresholdFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    updateThresholdFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      className={cn("relative min-w-0 select-none", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isDragging) setIsHovered(false);
      }}
    >
      {/* Tooltip hiển thị khi hover hoặc đang kéo */}
      {(showTooltip || interactive) && (isHovered || isDragging) && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-3 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-700/80 bg-zinc-900/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur transition-opacity duration-150"
        >
          <div className="space-y-1 font-sans">
            <div className="flex items-center justify-between gap-5">
              <span className="text-zinc-400">{t("detail.tooltipRemaining")}:</span>
              <strong className="font-mono text-white">{meters(remaining)} m</strong>
            </div>
            <div className="flex items-center justify-between gap-5">
              <span className="text-zinc-400">{t("detail.tooltipReceived")}:</span>
              <span className="font-mono text-zinc-300">{meters(received)} m</span>
            </div>
            <div className="flex items-center justify-between gap-5">
              <span className="text-zinc-400">{t("detail.tooltipYield")}:</span>
              <span className="text-zinc-200">
                {tops !== undefined && tops !== null ? t("topsLeft", { count: tops }) : t("noYield")}
              </span>
            </div>
            <div className="flex items-center justify-between gap-5 border-t border-zinc-700/80 pt-1">
              <span className="font-medium text-amber-400">{t("detail.tooltipThreshold")}:</span>
              <strong className="font-mono text-amber-300">{meters(threshold)} m</strong>
            </div>
          </div>
          {/* Mũi tên tooltip */}
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-zinc-700/80 bg-zinc-900" />
        </div>
      )}

      {/* Dòng tiêu đề hiển thị số mét còn lại và ước tính may được */}
      <div className="flex items-baseline justify-between gap-3">
        <p className="whitespace-nowrap">
          <span
            className={cn(
              "font-mono text-body font-semibold tabular-nums",
              status === "OUT" ? "text-rose-600" : "text-[#09090B]"
            )}
          >
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

      {/* Vùng thanh thước đo */}
      <div
        ref={meterRef}
        className={cn(
          "relative mt-2 touch-none",
          interactive && "cursor-pointer"
        )}
        role="presentation"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="h-1.5 overflow-hidden rounded-full bg-[#F4F4F5]">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              FILL_CLASS[status]
            )}
            style={{ width: percent(remaining) }}
          />
        </div>

        {/* Vạch mốc ngưỡng cảnh báo */}
        <div
          className={cn(
            "group/marker absolute -top-2 flex h-6 w-4 -translate-x-1/2 items-center justify-center",
            interactive ? "cursor-ew-resize" : "pointer-events-none"
          )}
          style={{ left: percent(threshold) }}
        >
          {/* Vạch kẻ đứng cắt ngang thanh */}
          <span
            aria-hidden
            className={cn(
              "h-3.5 w-[2px] transition-colors duration-150",
              isDragging ? "bg-amber-600 scale-y-125" : "bg-[#3F3F46] group-hover/marker:bg-amber-600"
            )}
          />
          {/* Núm nắm trực quan khi kéo */}
          {interactive && (
            <span
              className={cn(
                "absolute -top-1 h-1.5 w-1.5 rounded-full bg-amber-500 transition-transform",
                isDragging ? "scale-125" : "opacity-0 group-hover/marker:opacity-100"
              )}
            />
          )}
        </div>

        {/* Vạch chia như thước dây */}
        <div
          aria-hidden
          className="mt-1 h-1 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(to right, #D4D4D8 0 1px, transparent 1px ${(step / scale) * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}
