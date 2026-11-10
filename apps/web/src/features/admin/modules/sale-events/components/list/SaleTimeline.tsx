"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { AdminTooltip } from "@/features/admin/core/ui";
import { type AdminSaleEvent } from "../../types/saleEvents.types";
import { DAY_MS, HOUR_MS, SHOP_TIME_ZONE, effectiveEnd, saleState, type SaleState } from "../../utils/saleRules";
import { useSaleDateText, useSaleOfferText } from "../shared/SaleParts";

/** Khung lịch: 2 tuần trước → 10 tuần tới — đủ thấy chương trình vừa xong lẫn mùa Tết sắp tới */
const PAST_DAYS = 14;
const TOTAL_DAYS = 84;

const BAR_CLASS: Record<SaleState, string> = {
  RUNNING: "bg-[#18181B] text-white",
  SCHEDULED: "bg-[#71717A] text-white",
  PAUSED: "bg-[repeating-linear-gradient(135deg,#FECDD3_0_6px,#FFF1F2_6px_12px)] text-rose-800 ring-1 ring-inset ring-rose-300",
  DRAFT: "border border-dashed border-[#A1A1AA] bg-white text-[#52525B]",
  ENDED: "bg-[#E4E4E7] text-[#71717A]",
};

/**
 * Lịch sale dạng dải thời gian: mỗi chương trình một hàng, thanh nằm đúng ngày chạy, vạch "hôm nay" dọc.
 * Mục đích là thấy KHOẢNG TRỐNG và CHỒNG LẤN giữa các đợt — thứ bảng danh sách không cho thấy.
 * Màn hẹp: cột tên ghim trái, phần lịch cuộn ngang.
 */
export function SaleTimeline({ events, now }: { events: AdminSaleEvent[]; now: string }) {
  const t = useTranslations("AdminPage.saleEvents");
  const format = useFormatter();
  const dateText = useSaleDateText();
  const offerText = useSaleOfferText();

  const nowMs = Date.parse(now);
  const todayStart = Math.floor((nowMs + 7 * HOUR_MS) / DAY_MS) * DAY_MS - 7 * HOUR_MS;
  const windowStart = todayStart - PAST_DAYS * DAY_MS;
  const windowEnd = windowStart + TOTAL_DAYS * DAY_MS;
  const pct = (ms: number) => ((Math.min(Math.max(ms, windowStart), windowEnd) - windowStart) / (windowEnd - windowStart)) * 100;

  const visible = events
    .filter((event) => Date.parse(event.startAt) < windowEnd && Date.parse(effectiveEnd(event)) > windowStart)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  // Vạch tuần: mỗi 7 ngày tính từ đầu khung; nhãn ngày theo giờ tiệm
  const weeks = Array.from({ length: TOTAL_DAYS / 7 + 1 }, (_, index) => windowStart + index * 7 * DAY_MS);
  const weekLabel = (ms: number) => format.dateTime(new Date(ms), { day: "numeric", month: "numeric", timeZone: SHOP_TIME_ZONE });
  const hiddenCount = events.length - visible.length;

  return (
    <div>
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <div className="min-w-[720px]">
          {/* Hàng nhãn tuần */}
          <div className="flex h-7 items-end">
            <div className="sticky left-0 z-10 w-36 shrink-0 bg-white sm:w-48" />
            <div className="relative h-full flex-1">
              {weeks.slice(0, -1).map((ms) => (
                <span key={ms} className="absolute bottom-1 -translate-x-1/2 text-2xs tabular-nums text-[#A1A1AA]" style={{ left: `${pct(ms)}%` }}>
                  {weekLabel(ms)}
                </span>
              ))}
              <span className="absolute bottom-1 z-10 -translate-x-1/2 rounded bg-[#18181B] px-1.5 py-px text-2xs font-medium text-white" style={{ left: `${pct(nowMs)}%` }}>
                {t("timeline.today")}
              </span>
            </div>
          </div>

          <div className="relative">
            {/* Lưới tuần + vạch hôm nay, nằm dưới các hàng */}
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-36 right-0 sm:left-48">
              {weeks.map((ms) => (
                <span key={ms} className="absolute inset-y-0 border-l border-dashed border-[#F4F4F5]" style={{ left: `${pct(ms)}%` }} />
              ))}
              <span className="absolute inset-y-0 z-[1] border-l-2 border-[#18181B]" style={{ left: `${pct(nowMs)}%` }} />
            </div>

            {visible.length === 0 && <p className="py-8 pl-36 text-sm text-[#71717A] sm:pl-48">{t("timeline.empty")}</p>}

            {visible.map((event) => {
              const state = saleState(event, now);
              const startMs = Date.parse(event.startAt);
              const endMs = Date.parse(effectiveEnd(event));
              const left = pct(startMs);
              const width = Math.max(pct(endMs) - left, 1.2);
              const clippedStart = startMs < windowStart;
              const clippedEnd = endMs > windowEnd;
              return (
                <div key={event.id} className="group flex h-11 items-center">
                  <Link
                    href={`/admin/sale-events/${event.id}`}
                    className="sticky left-0 z-10 flex h-full w-36 shrink-0 items-center bg-white pr-3 sm:w-48"
                  >
                    <span className="truncate text-sm text-[#3F3F46] group-hover:text-[#09090B] group-hover:underline">{event.name}</span>
                  </Link>
                  <div className="relative h-full flex-1">
                    <AdminTooltip
                      content={
                        <span className="block">
                          <span className="block font-medium">{event.name}</span>
                          <span className="block text-[#D4D4D8]">
                            {offerText(event)} · {dateText(event.startAt)} → {dateText(effectiveEnd(event))}
                          </span>
                          <span className="block text-[#D4D4D8]">{event.endedEarlyAt ? t("state.ENDED_EARLY") : t(`state.${state}`)}</span>
                        </span>
                      }
                    >
                      <Link
                        href={`/admin/sale-events/${event.id}`}
                        aria-label={event.name}
                        className={cn(
                          "absolute top-1/2 flex h-7 -translate-y-1/2 items-center overflow-hidden px-2 text-2xs font-medium transition-opacity hover:opacity-85",
                          clippedStart ? "rounded-r-md" : "rounded-l-md",
                          clippedEnd ? "rounded-l-md" : "rounded-r-md",
                          !clippedStart && !clippedEnd && "rounded-md",
                          BAR_CLASS[state]
                        )}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <span className="truncate">{event.badge}</span>
                      </Link>
                    </AdminTooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-dashed border-[#E4E4E7] pt-3 text-xs text-[#71717A]">
        {(["RUNNING", "SCHEDULED", "PAUSED", "DRAFT", "ENDED"] as const).map((state) => (
          <span key={state} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn("h-2.5 w-5 rounded-sm", BAR_CLASS[state])} />
            {t(`state.${state}`)}
          </span>
        ))}
        {hiddenCount > 0 && <span className="ml-auto">{t("timeline.hidden", { count: hiddenCount })}</span>}
      </div>
    </div>
  );
}
