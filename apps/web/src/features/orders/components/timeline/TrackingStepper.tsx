"use client";

import { Check, Ruler, Scissors, ShieldCheck, Shirt, Truck, type LucideIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { TRACKING_STEPS, type TrackingProgress, type TrackingStep } from "@repo/shared/orders";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<TrackingStep, LucideIcon> = {
  MEASUREMENTS_RECEIVED: Ruler,
  FABRIC_CUTTING: Scissors,
  SEWING: Shirt,
  FINAL_CHECK: ShieldCheck,
  SHIPPING: Truck,
};

interface TrackingStepperProps {
  progress: TrackingProgress;
  /** Mốc thời gian từng bước (ISO) — có ở timeline đầy đủ, không có ở kết quả tra cứu nhanh */
  stepDates?: (string | null)[];
}

/**
 * 5 bước may: nhận số đo → cắt vải → may → kiểm tra cuối → giao hàng.
 * Desktop: hàng ngang nối bằng vạch; mobile: cột dọc (đọc từ trên xuống, không phải cuộn ngang).
 * Bước đã qua có dấu ✓, bước hiện tại tô đậm + nhãn "Đang thực hiện"; đơn hủy hiện nhãn hủy ở bước dừng lại.
 */
export function TrackingStepper({ progress, stepDates }: TrackingStepperProps) {
  const t = useTranslations("OrdersPage.steps");
  const format = useFormatter();
  const isCancelled = progress.state === "CANCELLED";

  return (
    <ol aria-label={t("label")} className="relative grid gap-0 sm:grid-cols-5 sm:gap-2">
      {TRACKING_STEPS.map((step, index) => {
        const Icon = STEP_ICONS[step];
        const isDone = index < progress.currentStep;
        const isCurrent = index === progress.currentStep && progress.state === "ACTIVE";
        const isStoppedHere = isCancelled && index === progress.currentStep;
        const date = stepDates?.[index];

        return (
          <li
            key={step}
            aria-current={isCurrent ? "step" : undefined}
            className="relative flex gap-4 pb-6 last:pb-0 sm:flex-col sm:items-center sm:gap-3 sm:pb-0 sm:text-center"
          >
            {/* Vạch nối: dọc trên mobile, ngang trên desktop */}
            {index < TRACKING_STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px sm:left-[calc(50%+1.5rem)] sm:top-5 sm:h-px sm:w-[calc(100%-3rem+0.5rem)]",
                  isDone ? "bg-(--primary-color)" : "bg-(--border)"
                )}
              />
            ) : null}

            <span
              className={cn(
                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors",
                isDone && "border-(--primary-color) bg-(--primary-color) text-white",
                isCurrent && "border-(--primary-color) bg-(--bg-card) text-(--primary-ink) ring-4 ring-(--primary-color)/15",
                isStoppedHere && "border-(--danger) bg-(--bg-card) text-(--danger)",
                !isDone && !isCurrent && !isStoppedHere && "border-(--border) bg-(--bg-card) text-(--text-light)"
              )}
            >
              {isDone ? <Check size={18} strokeWidth={2} aria-hidden="true" /> : <Icon size={18} strokeWidth={1.5} aria-hidden="true" />}
            </span>

            <div className="min-w-0 pt-1 sm:pt-0">
              <p className={cn("text-sm font-semibold leading-5", isDone || isCurrent ? "text-(--text-main)" : "text-(--text-light)")}>
                {t(`${step}.title`)}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-(--text-light)">{t(`${step}.description`)}</p>
              {isCurrent ? (
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-(--primary-ink)">{t("current")}</p>
              ) : null}
              {isStoppedHere ? (
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-(--danger)">{t("cancelled")}</p>
              ) : null}
              {date && (isDone || isCurrent) ? (
                <p className="mt-1 text-xs tabular-nums text-(--text-light)">
                  {format.dateTime(new Date(date), { day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
