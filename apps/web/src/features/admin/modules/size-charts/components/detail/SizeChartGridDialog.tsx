"use client";

import { useState } from "react";
import { AlertTriangle, Ruler } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
} from "@/features/admin/core/ui";
import { saveSizeChartGridAction } from "../../actions/sizeCharts.actions";
import { type AdminSizeChartDetail } from "../../types/sizeCharts.types";
import { collectGridIssues } from "../../utils/sizeChartGrid";
import { createStarterGrid } from "../../utils/sizeChartStarter";
import { SizeChartGrid } from "../editor/SizeChartGrid";

/**
 * Dialog nhập / sửa lưới số đo của bảng size mẫu (chọn thông số, khoảng min–max, ngưỡng hợp lệ, "Bigsize từ",
 * dán từ Excel). Bảng chưa có hàng size thì mở sẵn các hàng gợi ý theo nhóm hàng.
 */
export function SizeChartGridDialog({
  chart,
  title,
  onOpenChange,
}: {
  chart: AdminSizeChartDetail;
  /** Tên bảng theo ngôn ngữ đang xem */
  title: string;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("AdminPage.sizeCharts");
  const notify = useNotify();
  const router = useRouter();
  const [columns, setColumns] = useState(chart.columns);
  const [rows, setRows] = useState(() => (chart.rows.length > 0 ? chart.rows : createStarterGrid(chart.group).rows));
  const [isSaving, setIsSaving] = useState(false);

  const issues = collectGridIssues(columns, rows);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveSizeChartGridAction({
        sizeChartId: chart.id,
        columns,
        rows: rows.map(({ sizeLabel, values }) => ({ sizeLabel: sizeLabel.trim(), values })),
      });
      if (!res.success) {
        notify.error(res.error, "SIZE_CHART_UPDATE_FAILED");
        return;
      }
      notify.success(t("gridDialog.saved"));
      onOpenChange(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={Ruler}
      title={t("gridDialog.title", { name: title })}
      description={t("gridDialog.description")}
      size="5xl"
      footer={
        <>
          {issues.total > 0 && (
            <p role="alert" className="mr-auto flex items-center gap-1.5 text-xs text-rose-600">
              <AlertTriangle size={13} aria-hidden /> {t("gridDialog.issues", { count: issues.total })}
            </p>
          )}
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || issues.total > 0}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {isSaving ? t("processing") : t("gridDialog.save")}
          </button>
        </>
      }
    >
      <SizeChartGrid
        group={chart.group}
        columns={columns}
        rows={rows}
        issues={issues}
        onColumnsChange={setColumns}
        onRowsChange={setRows}
      />
    </AdminDialog>
  );
}
