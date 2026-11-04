"use client";

import { Ruler } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminDialog } from "@/features/admin/core/ui";
import { type MeasurementSnapshot, type TodayAppointment } from "../types/dashboard.types";

interface DashboardMeasurementDialogProps {
  appointment: TodayAppointment | null;
  onClose: () => void;
}

// Thứ tự hiển thị các số đo (cm, riêng cân nặng là kg)
const FIELDS = [
  "height",
  "weight",
  "bust",
  "waist",
  "hips",
  "shoulder",
  "armLength",
  "shirtLength",
  "pantsLength",
] as const satisfies readonly (keyof MeasurementSnapshot)[];

/**
 * Hồ sơ số đo của khách trong lịch hẹn — mở nhanh từ danh sách lịch hẹn hôm nay
 */
export function DashboardMeasurementDialog({ appointment, onClose }: DashboardMeasurementDialogProps) {
  const t = useTranslations("AdminPage.dashboard.schedule");
  const measurement = appointment?.measurement;

  return (
    <AdminDialog
      open={Boolean(appointment)}
      onOpenChange={(open) => !open && onClose()}
      icon={Ruler}
      title={t("dialogTitle", { name: appointment?.customerName ?? "" })}
      description={measurement ? t("source", { source: measurement.source }) : undefined}
    >
      {measurement ? (
        <div>
          <dl className="grid grid-cols-3 gap-x-3 gap-y-4">
            {FIELDS.map((field) => (
              <div key={field}>
                <dt className="text-2xs text-[#71717A]">{t(`fields.${field}`)}</dt>
                <dd className="font-mono text-sm font-semibold text-[#09090B]">
                  {measurement[field] ?? "—"}
                  {measurement[field] != null ? (
                    <span className="ml-0.5 text-2xs font-normal text-[#A1A1AA]">
                      {field === "weight" ? "kg" : "cm"}
                    </span>
                  ) : null}
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
        <p className="py-6 text-center text-xs text-[#71717A]">{t("noMeasurement")}</p>
      )}
    </AdminDialog>
  );
}
