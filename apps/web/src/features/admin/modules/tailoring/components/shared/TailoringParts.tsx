"use client";

import { Shirt } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { cn } from "@/lib/utils";
import { AdminTooltip } from "@/features/admin/core/ui";
import { TAILORING_STAGES, type TailoringStage } from "../../types/tailoring.types";
import {
  SHOP_TIME_ZONE,
  STAGE_ICONS,
  stageIndex,
  type DueState,
  type TailoringInsight,
  type TailoringSignal,
} from "../../utils/tailoringInsight";

/** Ảnh dọc 3:4 của mẫu áo */
export function TailoringThumb({ image, className }: { image: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "grid aspect-[3/4] w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F4F4F5] ring-1 ring-[#E4E4E7]/70",
        className
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm do admin nhập (URL tùy ý), không qua next/image
        <img src={image} alt="" className="size-full object-contain" />
      ) : (
        <Shirt size={16} className="text-[#A1A1AA]" aria-hidden />
      )}
    </span>
  );
}

/**
 * Thanh 6 công đoạn của một món: đoạn đã qua tô đậm, công đoạn hiện tại là chấm có viền, phía sau để nhạt.
 * `compact` chỉ vẽ thanh; bản đầy đủ có nhãn công đoạn hiện tại.
 */
export function StageTrack({ stage, muted, className }: { stage: TailoringStage; muted?: boolean; className?: string }) {
  const t = useTranslations("AdminPage.tailoring");
  const current = stageIndex(stage);
  return (
    <ol className={cn("flex items-center gap-1", className)} aria-label={t("trackLabel", { stage: t(`stage.${stage}`) })}>
      {TAILORING_STAGES.map((value, index) => (
        <li key={value} className="flex flex-1 items-center">
          <AdminTooltip content={t(`stage.${value}`)}>
            <span
              className={cn(
                "block h-1.5 w-full rounded-full transition-colors",
                index < current
                  ? muted
                    ? "bg-[#A1A1AA]"
                    : "bg-[#18181B]"
                  : index === current
                    ? stage === "COMPLETED"
                      ? "bg-emerald-500"
                      : muted
                        ? "bg-[#D4D4D8]"
                        : "bg-[#18181B]/45"
                    : "bg-[#E4E4E7]"
              )}
            />
          </AdminTooltip>
        </li>
      ))}
    </ol>
  );
}

/** Nhãn công đoạn có icon */
export function StageLabel({ stage, className }: { stage: TailoringStage; className?: string }) {
  const t = useTranslations("AdminPage.tailoring");
  const Icon = STAGE_ICONS[stage];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <Icon size={13} aria-hidden className="shrink-0 text-[#71717A]" />
      {t(`stage.${stage}`)}
    </span>
  );
}

const DUE_CLASS: Record<DueState, string> = {
  OVERDUE: "text-rose-600",
  AT_RISK: "text-rose-600",
  DUE_SOON: "text-amber-700",
  ON_TRACK: "text-[#3F3F46]",
  NO_DUE: "text-[#A1A1AA]",
  DONE: "text-emerald-700",
};

/** "Còn 3 ngày · hẹn 13/11" / "Trễ 2 ngày" / "Không kịp — cần ~6 ngày, còn 2" */
export function DueText({ insight, dueDate, className }: { insight: TailoringInsight; dueDate: string | null; className?: string }) {
  const t = useTranslations("AdminPage.tailoring");
  const format = useFormatter();
  const date = dueDate
    ? format.dateTime(new Date(dueDate), { day: "numeric", month: "numeric", timeZone: SHOP_TIME_ZONE })
    : null;
  const { dueState, daysLeft, workLeft } = insight;

  let text: string;
  if (dueState === "NO_DUE") text = t("due.none");
  else if (daysLeft === null) text = t("due.none");
  else if (daysLeft < 0) text = t("due.overdue", { days: -daysLeft, date: date ?? "" });
  else if (dueState === "AT_RISK" && daysLeft === 0) text = t("due.todayAtRisk", { work: workLeft, date: date ?? "" });
  else if (dueState === "AT_RISK") text = t("due.atRisk", { days: daysLeft, work: workLeft, date: date ?? "" });
  else if (daysLeft === 0) text = t("due.today", { date: date ?? "" });
  else text = t("due.left", { days: daysLeft, date: date ?? "" });

  return <span className={cn("whitespace-nowrap", DUE_CLASS[dueState], className)}>{text}</span>;
}

const SIGNAL_CLASS: Record<TailoringSignal["kind"], string> = {
  CANCELLED: "text-rose-600",
  UNCONFIRMED: "text-amber-700",
  DEPOSIT_MISSING: "text-amber-700",
  STALLED: "text-[#71717A]",
  WAITING_PACK: "text-emerald-700",
};

/** Tín hiệu cần chú ý của đơn — một dòng chữ ngăn bằng "·", chỉ đổi màu chữ theo mức độ (không ô màu) */
export function SignalText({ signals, className }: { signals: TailoringSignal[]; className?: string }) {
  const t = useTranslations("AdminPage.tailoring");
  const locale = useLocale() as Locale;
  if (signals.length === 0) return null;
  const label = (signal: TailoringSignal) => {
    switch (signal.kind) {
      case "DEPOSIT_MISSING":
        return t("signal.DEPOSIT_MISSING", { amount: formatVnd(signal.missing, locale) });
      case "STALLED":
        return t("signal.STALLED", { days: signal.days, stage: t(`stage.${signal.stage}`) });
      default:
        return t(`signal.${signal.kind}`);
    }
  };
  return (
    <p className={cn("text-xs leading-relaxed", className)}>
      {signals.map((signal, index) => (
        <span key={signal.kind} className={SIGNAL_CLASS[signal.kind]}>
          {index > 0 && <span className="text-[#D4D4D8]"> · </span>}
          {label(signal)}
        </span>
      ))}
    </p>
  );
}
