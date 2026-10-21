"use client";

import { useState, type ReactNode } from "react";
import { CalendarClock, Hourglass, Scissors, Wallet, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd } from "@repo/shared";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminSegmentedControl } from "@/features/admin/core/ui";
import { type DashboardKpis, URGENT_DAYS } from "../types/dashboard.types";

interface DashboardKpiCardsProps {
  kpis?: DashboardKpis;
  isLoading?: boolean;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  action,
  children,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  tone?: "default" | "warning";
}) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "flex min-w-0 flex-col gap-4 p-5")}>
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 truncate text-xs font-semibold uppercase tracking-[0.5px] text-[#71717A]">
          <Icon size={14} />
          {label}
        </span>
        {action}
      </div>
      <div className={cn("font-mono text-3xl font-bold tracking-tight", tone === "warning" ? "text-amber-700" : "text-[#09090B]")}>
        {value}
      </div>
      <div className="mt-auto border-t border-[#F4F4F5] pt-3 text-xs text-[#71717A]">{children}</div>
    </section>
  );
}

/** Ô số nhỏ trong phần tách chi tiết của thẻ */
function Breakdown({ items }: { items: { label: string; value: number }[] }) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="truncate text-[11px]">{item.label}</dt>
          <dd className="font-mono text-sm font-semibold text-[#09090B]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A. 4 thẻ chỉ số vận hành trong ngày — thẻ nào không có quyền xem thì ẩn
 */
export function DashboardKpiCards({ kpis, isLoading }: DashboardKpiCardsProps) {
  const t = useTranslations("AdminPage.dashboard.kpi");
  const [range, setRange] = useState<"today" | "month">("today");

  if (isLoading || !kpis) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(ADMIN_CARD_CLASS, "h-[178px] animate-pulse bg-[#FAFAFA]")} />
        ))}
      </div>
    );
  }

  const { finance, tailoring, urgent, appointments } = kpis;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {finance && (
        <KpiCard
          icon={Wallet}
          label={t("finance")}
          value={formatVnd(range === "today" ? finance.receivedToday : finance.receivedMonth)}
          action={
            <AdminSegmentedControl
              value={range}
              onChange={setRange}
              options={[
                { value: "today", label: t("today") },
                { value: "month", label: t("month") },
              ]}
            />
          }
        >
          <div className="flex items-center justify-between gap-2">
            <span>{t("outstanding")}</span>
            <span className="font-mono text-sm font-semibold text-amber-700">{formatVnd(finance.outstanding)}</span>
          </div>
          <p className="mt-0.5 text-[11px]">{t("outstandingOrders", { count: finance.outstandingOrders })}</p>
        </KpiCard>
      )}

      {tailoring && (
        <KpiCard icon={Scissors} label={t("tailoring")} value={tailoring.waitingCut + tailoring.sewing + tailoring.embroidery}>
          <Breakdown
            items={[
              { label: t("waitingCut"), value: tailoring.waitingCut },
              { label: t("sewing"), value: tailoring.sewing },
              { label: t("embroidery"), value: tailoring.embroidery },
            ]}
          />
        </KpiCard>
      )}

      {urgent && (
        <KpiCard
          icon={Hourglass}
          label={t("urgent")}
          value={urgent.dueSoon}
          tone={urgent.dueSoon > 0 ? "warning" : "default"}
        >
          <p>{t("urgentHint", { days: URGENT_DAYS })}</p>
          <p className={cn("mt-0.5 text-[11px] font-medium", urgent.overdue > 0 ? "text-rose-700" : "text-emerald-700")}>
            {urgent.overdue > 0 ? t("overdue", { count: urgent.overdue }) : t("noOverdue")}
          </p>
        </KpiCard>
      )}

      {appointments && (
        <KpiCard icon={CalendarClock} label={t("appointments")} value={appointments.total}>
          <Breakdown
            items={[
              { label: t("measurement"), value: appointments.measurement },
              { label: t("fitting"), value: appointments.fitting },
              { label: t("other"), value: appointments.total - appointments.measurement - appointments.fitting },
            ]}
          />
        </KpiCard>
      )}
    </div>
  );
}
