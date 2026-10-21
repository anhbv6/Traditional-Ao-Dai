"use client";

import { Ruler } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type MeasurementSnapshot, type TodayAppointment } from "../types/dashboard.types";

interface DashboardMeasurementDialogProps {
  appointment: TodayAppointment | null;
  onClose: () => void;
}

// Thứ tự hiển thị các số đo (cm, riêng cân nặng là kg)
const FIELDS = ["height", "weight", "bust", "waist", "hips", "shoulder", "armLength", "shirtLength", "pantsLength"] as const satisfies readonly (keyof MeasurementSnapshot)[];

/**
 * Hồ sơ số đo của khách trong lịch hẹn — mở nhanh từ danh sách lịch hẹn hôm nay
 */
export function DashboardMeasurementDialog({ appointment, onClose }: DashboardMeasurementDialogProps) {
  const t = useTranslations("AdminPage.dashboard.schedule");
  const measurement = appointment?.measurement;

  return (
    <Dialog open={Boolean(appointment)} onOpenChange={(open) => !open && onClose()}>
      {/* Portal nằm ngoài layout admin → tự gắn admin-shell để dùng font & màu khu quản trị */}
      <DialogContent className="admin-shell overflow-hidden rounded-xl border border-[#E4E4E7] bg-white p-0 shadow-xl sm:max-w-[440px]">
        <DialogHeader className="border-b border-[#F4F4F5] p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-[#18181B] text-white">
              <Ruler size={16} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold text-[#09090B]">
                {t("dialogTitle", { name: appointment?.customerName ?? "" })}
              </DialogTitle>
              {measurement ? (
                <DialogDescription className="text-xs text-[#71717A]">{t("source", { source: measurement.source })}</DialogDescription>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        {measurement ? (
          <div className="p-5">
            <dl className="grid grid-cols-3 gap-x-3 gap-y-4">
              {FIELDS.map((field) => (
                <div key={field}>
                  <dt className="text-[11px] text-[#71717A]">{t(`fields.${field}`)}</dt>
                  <dd className="font-mono text-sm font-semibold text-[#09090B]">
                    {measurement[field] ?? "—"}
                    {measurement[field] != null ? <span className="ml-0.5 text-[11px] font-normal text-[#A1A1AA]">{field === "weight" ? "kg" : "cm"}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
            {measurement.note ? (
              <p className="mt-4 rounded-lg bg-[#FAFAFA] p-3 text-xs text-[#3F3F46]">
                <span className="font-semibold">{t("note")}:</span> {measurement.note}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="p-8 text-center text-xs text-[#71717A]">{t("noMeasurement")}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
