"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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
    <Dialog open={chart !== null} onOpenChange={onOpenChange}>
      <DialogContent className="admin-shell flex max-h-[96dvh] w-auto max-w-[calc(100%-1.5rem)] flex-col items-center gap-3 rounded-xl border border-[#E4E4E7] bg-[#F4F4F5] p-4 sm:max-w-md sm:p-5">
        <div className="w-full pr-8">
          <DialogTitle className="text-sm font-semibold text-[#09090B]">{t("title")}</DialogTitle>
          <DialogDescription className="text-xs text-[#71717A]">{t("description")}</DialogDescription>
        </div>
        {chart && (
          <div className="h-[min(720px,calc(96dvh-7rem))] w-[min(375px,calc(100vw-4rem))] overflow-hidden rounded-[2rem] border-[6px] border-[#18181B] bg-white shadow-xl">
            <SizeAdvisorWidget key={chart.name} chart={chart} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
