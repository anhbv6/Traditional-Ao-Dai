"use client";
// Lý do "use client": giữ chữ đang gõ, trạng thái mở lịch, tháng đang xem và bắt sự kiện gõ / bấm.

import { useId, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAnchorPositionMethod } from "@/hooks/useAnchorPositionMethod";

/** Ngày lịch dạng `YYYY-MM-DD` (theo giờ Việt Nam) — cùng định dạng với `<input type="date">` */
type IsoDay = string;

interface CalendarView {
  year: number;
  /** 0–11 */
  month: number;
}

const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";
const YEARS_PER_PAGE = 12;

const pad = (value: number) => String(value).padStart(2, "0");
const toIsoDay = (year: number, month: number, day: number): IsoDay => `${year}-${pad(month + 1)}-${pad(day)}`;
const todayIso = (): IsoDay => new Date().toLocaleDateString("sv-SE", { timeZone: VN_TIME_ZONE });
const viewOf = (day: IsoDay): CalendarView => ({ year: Number(day.slice(0, 4)), month: Number(day.slice(5, 7)) - 1 });

/** `YYYY-MM-DD` → `dd/MM/yyyy` để hiện trong ô nhập */
const formatDay = (day: IsoDay) => (day ? `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}` : "");

/** Đọc `d/M/yyyy` (chấp nhận `-` hoặc `.`), trả `null` nếu không phải ngày có thật */
function parseDay(text: string): IsoDay | null {
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  const date = new Date(Date.UTC(year, month, day));
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day;
  return valid ? toIsoDay(year, month, day) : null;
}

interface AdminDatePickerProps {
  /** `YYYY-MM-DD`, rỗng = chưa chọn */
  value: IsoDay;
  onChange: (value: IsoDay) => void;
  onBlur?: () => void;
  /** Ngày sớm / muộn nhất được chọn (`YYYY-MM-DD`) — ngày ngoài khoảng bị làm mờ */
  min?: IsoDay;
  max?: IsoDay;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Ô chọn một ngày cho admin: gõ `dd/MM/yyyy` hoặc chọn trên lịch tháng (bấm tiêu đề → chọn tháng → chọn năm
 * để nhảy xa). Giá trị là `YYYY-MM-DD` như `<input type="date">` nên thay thẳng được trong form sẵn có.
 * Chữ gõ dở mà không thành ngày hợp lệ thì khi rời ô sẽ trả về ngày đang chọn.
 */
export function AdminDatePicker({
  value,
  onChange,
  onBlur,
  min,
  max,
  invalid,
  disabled,
  id,
  className,
}: AdminDatePickerProps) {
  const t = useTranslations("AdminPage.datePicker");
  const generatedId = useId();
  const committed = formatDay(value);
  // Chữ đang gõ, chỉ giữ khi còn khác giá trị đã chốt
  const [draft, setDraft] = useState<{ text: string; source: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CalendarView>(() => viewOf(value || todayIso()));
  const [mode, setMode] = useState<"days" | "months" | "years">("days");
  const { positionMethod, captureAnchor } = useAnchorPositionMethod();

  const text = draft && draft.source === committed ? draft.text : committed;
  const outOfRange = (day: IsoDay) => (!!min && day < min) || (!!max && day > max);

  const commit = (day: IsoDay) => {
    setDraft(null);
    onChange(day);
  };

  const handleTextChange = (next: string) => {
    setDraft({ text: next, source: committed });
    if (next.trim() === "") return commit("");
    const parsed = parseDay(next);
    if (parsed && !outOfRange(parsed)) commit(parsed);
  };

  // Mở lịch: luôn bắt đầu ở tháng của ngày đang chọn (hoặc tháng hiện tại)
  const handleOpenChange = (next: boolean, details: { event: Event }) => {
    if (next) captureAnchor(details.event);
    if (next) {
      setView(viewOf(value || todayIso()));
      setMode("days");
    }
    setOpen(next);
  };

  const shiftMonth = (delta: number) =>
    setView(({ year, month }) => {
      const index = year * 12 + month + delta;
      return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
    });

  const today = todayIso();
  const firstWeekday = (new Date(Date.UTC(view.year, view.month, 1)).getUTCDay() + 6) % 7; // thứ Hai = 0
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const yearStart = view.year - (view.year % YEARS_PER_PAGE);

  const navButton = (direction: -1 | 1) => (
    <button
      type="button"
      aria-label={direction < 0 ? t("previous") : t("next")}
      onClick={() =>
        mode === "days"
          ? shiftMonth(direction)
          : setView((v) => ({ ...v, year: v.year + direction * (mode === "years" ? YEARS_PER_PAGE : 1) }))
      }
      className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#3F3F46] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
    >
      {direction < 0 ? <ChevronLeft size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
    </button>
  );

  const cellClass = (selected: boolean, isToday: boolean, muted: boolean) =>
    cn(
      "grid cursor-pointer place-items-center rounded-lg text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#18181B]/20 disabled:cursor-not-allowed",
      selected
        ? "bg-[#18181B] font-semibold text-white"
        : cn(
            "hover:bg-[#F4F4F5] disabled:hover:bg-transparent",
            isToday && "border border-[#18181B] font-semibold",
            muted ? "text-[#A1A1AA]" : "text-[#09090B]"
          )
    );

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <input
        id={id ?? generatedId}
        value={text}
        onChange={(event) => handleTextChange(event.target.value)}
        onBlur={() => {
          setDraft(null);
          onBlur?.();
        }}
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        disabled={disabled}
        aria-invalid={invalid}
        className="h-9 w-full min-w-0 flex-1 rounded-xl border border-[#E4E4E7] bg-white px-3 text-sm tabular-nums text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B] disabled:cursor-not-allowed disabled:bg-[#FAFAFA] aria-invalid:border-rose-400"
      />
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger
          disabled={disabled}
          aria-label={t("open")}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-[#E4E4E7] bg-white text-[#52525B] outline-none transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B] focus-visible:border-[#18181B] disabled:cursor-not-allowed disabled:opacity-60 data-popup-open:border-[#18181B]"
        >
          <CalendarDays size={16} aria-hidden />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            positionMethod={positionMethod}
            side="bottom"
            align="end"
            sideOffset={6}
            collisionPadding={12}
            className="z-50 outline-none"
          >
            <Popover.Popup className="admin-shell w-[296px] origin-[var(--transform-origin)] rounded-xl border border-[#E4E4E7] bg-white p-3 shadow-[0_16px_40px_-16px_rgba(9,9,11,0.25)] outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0">
              <div className="mb-2 flex items-center justify-between">
                {navButton(-1)}
                <Popover.Title
                  render={
                    <button
                      type="button"
                      onClick={() => setMode((m) => (m === "days" ? "months" : m === "months" ? "years" : "days"))}
                    />
                  }
                  className="cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#F4F4F5]"
                >
                  {mode === "years"
                    ? `${yearStart} – ${yearStart + YEARS_PER_PAGE - 1}`
                    : mode === "months"
                      ? t("yearTitle", { year: view.year })
                      : t("monthTitle", { month: view.month + 1, year: view.year })}
                </Popover.Title>
                {navButton(1)}
              </div>

              {mode === "days" && (
                <>
                  <div className="grid grid-cols-7 pb-1 text-center text-xs font-medium text-[#71717A]">
                    {t("weekdays")
                      .split(",")
                      .map((weekday) => (
                        <span key={weekday} className="py-1.5">
                          {weekday}
                        </span>
                      ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: firstWeekday }, (_, i) => (
                      <span key={`blank-${i}`} aria-hidden />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = toIsoDay(view.year, view.month, i + 1);
                      const blocked = outOfRange(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={blocked}
                          aria-pressed={day === value}
                          aria-current={day === today ? "date" : undefined}
                          onClick={() => {
                            commit(day);
                            setOpen(false);
                          }}
                          className={cn("h-9", cellClass(day === value, day === today, blocked))}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {mode === "months" && (
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 12 }, (_, month) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() => {
                        setView((v) => ({ ...v, month }));
                        setMode("days");
                      }}
                      className={cn(
                        "h-11",
                        cellClass(
                          !!value && viewOf(value).year === view.year && viewOf(value).month === month,
                          viewOf(today).year === view.year && viewOf(today).month === month,
                          false
                        )
                      )}
                    >
                      {t("monthShort", { month: month + 1 })}
                    </button>
                  ))}
                </div>
              )}

              {mode === "years" && (
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearStart + i).map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setView((v) => ({ ...v, year }));
                        setMode("months");
                      }}
                      className={cn(
                        "h-11",
                        cellClass(!!value && viewOf(value).year === year, viewOf(today).year === year, false)
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between border-t border-[#F4F4F5] pt-2">
                <button
                  type="button"
                  onClick={() => {
                    commit("");
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
                >
                  {t("clear")}
                </button>
                <button
                  type="button"
                  disabled={outOfRange(today)}
                  onClick={() => {
                    commit(today);
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-[#09090B] transition-colors hover:bg-[#F4F4F5] disabled:cursor-not-allowed disabled:text-[#A1A1AA] disabled:hover:bg-transparent"
                >
                  {t("today")}
                </button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
