"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// 01/01/2024 là thứ Hai — mốc để lấy tên thứ theo ngôn ngữ, tuần bắt đầu từ thứ Hai như lịch Việt
const WEEKDAYS = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i));

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Lưới 6 tuần của tháng (đủ ô đầu/cuối từ tháng liền kề để lịch không nhảy chiều cao khi đổi tháng) */
function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // thứ Hai = 0
  return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - offset + i));
}

/**
 * Lịch tháng thu nhỏ ở đầu thẻ "Việc hôm nay": xem nhanh ngày / thứ, lật tháng, bấm tiêu đề để về tháng hiện tại.
 * Chỉ để tra cứu — không chọn ngày.
 */
export function AdminMiniCalendar() {
  const t = useTranslations("AdminPage.todayNotes.calendar");
  const format = useFormatter();
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const shift = (delta: number) => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  return (
    <div className="px-4 pb-3 pt-4">
      <div className="mb-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
          disabled={isCurrentMonth}
          title={isCurrentMonth ? undefined : t("backToToday")}
          className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-semibold text-[#09090B] first-letter:uppercase disabled:cursor-default"
        >
          {format.dateTime(month, { month: "long", year: "numeric" })}
        </button>
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label={t("previous")}
          className="grid size-7 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]"
        >
          <ChevronLeft size={15} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label={t("next")}
          className="grid size-7 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]"
        >
          <ChevronRight size={15} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center" role="grid" aria-label={format.dateTime(month, { month: "long", year: "numeric" })}>
        {WEEKDAYS.map((day, index) => (
          <span
            key={day.getTime()}
            role="columnheader"
            className={cn(
              "pb-1 text-2xs font-medium uppercase",
              // Chủ nhật tách nhẹ để mắt bắt nhịp tuần
              index === 6 ? "text-[#A1A1AA]" : "text-[#71717A]"
            )}
          >
            {format.dateTime(day, { weekday: "narrow" })}
          </span>
        ))}
        {monthGrid(month).map((day) => {
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = sameDay(day, today);
          return (
            <span
              key={day.getTime()}
              role="gridcell"
              aria-current={isToday ? "date" : undefined}
              className="grid h-7 place-items-center"
            >
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full font-mono text-2xs tabular-nums",
                  isToday
                    ? "bg-[#18181B] font-semibold text-white"
                    : inMonth
                      ? (day.getDay() === 0 ? "text-[#71717A]" : "text-[#09090B]")
                      : "text-[#D4D4D8]"
                )}
              >
                {day.getDate()}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
