"use client";

import { Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminDialog } from "@/features/admin/core/ui";
import { type SizeChartPreviewData } from "../../types/sizeCharts.types";
import { SizeAdvisorWidget } from "./SizeAdvisorWidget";

/** Xem trước popup tư vấn size trong khung điện thoại — phần lớn khách mua trên di động */
export function SizeChartPreviewDialog({
  chart,
  onOpenChange,
}: {
  chart: SizeChartPreviewData | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("AdminPage.sizeCharts.preview");

  return (
    <AdminDialog
      open={chart !== null}
      onOpenChange={onOpenChange}
      icon={Smartphone}
      title={t("title")}
      description={t("description")}
      bodyClassName="flex justify-center bg-[#F4F4F5]"
    >
      {chart && (
        <div className="h-[min(720px,calc(92dvh-9rem))] w-[min(375px,calc(100vw-4rem))] overflow-hidden rounded-[2rem] border-[6px] border-[#18181B] bg-white shadow-xl">
          <SizeAdvisorWidget key={chart.name} chart={chart} />
        </div>
      )}
    </AdminDialog>
  );
}
