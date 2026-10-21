"use client";

import { CalendarCheck, Phone, Ruler } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "@/features/admin/core/ui";
import { type TodayAppointment } from "../types/dashboard.types";

interface DashboardScheduleProps {
  appointments: TodayAppointment[];
  isLoading?: boolean;
  onOpenMeasurement: (appointment: TodayAppointment) => void;
}

const TYPE_CLASS: Record<TodayAppointment["type"], string> = {
  MEASUREMENT: "bg-[#18181B] text-white",
  FITTING: "border border-[#E4E4E7] bg-white text-[#09090B]",
  PICKUP: "bg-emerald-50 text-emerald-700",
};

/**
 * C (trái). Lịch hẹn tại tiệm hôm nay theo khung giờ — bấm "Hồ sơ số đo" để mở nhanh số đo của khách
 */
export function DashboardSchedule({ appointments, isLoading, onOpenMeasurement }: DashboardScheduleProps) {
  const t = useTranslations("AdminPage.dashboard.schedule");
  const locale = useLocale();
  // Giờ hẹn hiển thị theo giờ Việt Nam bất kể múi giờ máy người xem
  const formatTime = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

  return (
    <section className={cn(ADMIN_CARD_CLASS, "flex flex-col")}>
      <header className="flex items-center justify-between gap-3 border-b border-[#E4E4E7] px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#09090B]">
          <CalendarCheck size={15} />
          {t("title")}
        </h2>
        <span className="font-mono text-xs text-[#71717A]">{appointments.length}</span>
      </header>

      {isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[#F4F4F5]" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <p className="flex flex-1 items-center justify-center p-10 text-xs text-[#71717A]">{t("empty")}</p>
      ) : (
        <ol className="divide-y divide-[#F4F4F5]">
          {appointments.map((appointment) => {
            return (
              <li key={appointment.id} className={cn("flex gap-4 px-5 py-3.5", appointment.isPast && "opacity-60")}>
                <time dateTime={appointment.scheduledAt} className="w-12 shrink-0 pt-0.5 font-mono text-sm font-semibold text-[#09090B]">
                  {formatTime.format(new Date(appointment.scheduledAt))}
                </time>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-[#09090B]">{appointment.customerName}</span>
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", TYPE_CLASS[appointment.type])}>
                      {t(`types.${appointment.type}`)}
                    </span>
                  </div>
                  {appointment.note ? <p className="mt-0.5 text-xs text-[#3F3F46]">{appointment.note}</p> : null}
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-[#71717A]">
                    {appointment.customerPhone ? (
                      <a href={`tel:${appointment.customerPhone}`} className="inline-flex items-center gap-1 hover:text-[#09090B]">
                        <Phone size={11} />
                        {appointment.customerPhone}
                      </a>
                    ) : null}
                    {appointment.orderNumber ? <span className="font-mono">{appointment.orderNumber}</span> : null}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenMeasurement(appointment)}
                  className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 self-center rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-xs font-medium text-[#3F3F46] transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B]"
                >
                  <Ruler size={13} />
                  <span className="hidden sm:inline">{t("viewMeasurement")}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
