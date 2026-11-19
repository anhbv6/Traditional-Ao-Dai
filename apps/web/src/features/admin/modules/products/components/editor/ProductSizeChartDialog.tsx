"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ProductGroup } from "@repo/shared/sizing";
import { useNotify } from "@/hooks/useNotify";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminTextField,
} from "@/features/admin/core/ui";
import {
  SizeChartGrid,
  collectGridIssues,
  createStarterGrid,
  rowHasMeasurement,
  type SizeChartColumnValue,
  type SizeChartRowValue,
} from "@/features/admin/modules/size-charts";
import { createProductSizeChartAction } from "../../actions/products.actions";
import { type AdminProductSizeChart } from "../../types/products.types";

export interface ProductSizeChartDialogProps {
  group: ProductGroup;
  defaultName: string;
  onClose: () => void;
  onCreated: (chart: AdminProductSizeChart) => void;
}

export function ProductSizeChartDialog({
  group,
  defaultName,
  onClose,
  onCreated,
}: ProductSizeChartDialogProps) {
  const t = useTranslations("AdminPage.products");
  const notify = useNotify();

  const [name, setName] = useState(defaultName);
  const [columns, setColumns] = useState<SizeChartColumnValue[]>(() => createStarterGrid(group).columns);
  const [rows, setRows] = useState<SizeChartRowValue[]>(() => createStarterGrid(group).rows);
  const [showMissing, setShowMissing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issues = collectGridIssues(columns, rows);
  const emptyRows = rows.filter((row) => !rowHasMeasurement(row)).length;
  const isComplete =
    columns.length > 0 &&
    rows.length > 0 &&
    issues.total === 0 &&
    emptyRows === 0 &&
    name.trim().length > 0;

  const handleSave = async () => {
    if (!isComplete) {
      setShowMissing(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createProductSizeChartAction({
        name: name.trim(),
        group,
        grid: { columns, rows },
      });

      if (!res.success) {
        notify.error(res.error, "SIZE_CHART_CREATE_FAILED");
        return;
      }

      notify.success(t("sizeChartCreated"));
      onCreated(res.data);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("createSizeChartTitle")}
      description={t("createSizeChartDesc")}
      size="5xl"
      footer={
        <>
          {showMissing && !isComplete && (
            <p role="alert" className="mr-auto flex items-center gap-1.5 text-xs text-rose-600">
              <AlertTriangle size={13} aria-hidden />
              {!name.trim()
                ? t("sizeChartNameRequired")
                : issues.total > 0
                  ? t("sizeChartIssues", { count: issues.total })
                  : columns.length === 0 || rows.length === 0
                    ? t("sizeChartEmpty")
                    : t("sizeChartMissingRows", { count: emptyRows })}
            </p>
          )}
          <button type="button" onClick={onClose} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {isSubmitting ? t("saving") : t("saveAndApply")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="max-w-md">
          <AdminTextField
            autoFocus
            required
            label={t("field.sizeChartName")}
            value={name}
            onValueChange={setName}
            placeholder={t("field.sizeChartNamePlaceholder")}
          />
        </div>

        <SizeChartGrid
          group={group}
          columns={columns}
          rows={rows}
          issues={issues}
          onColumnsChange={setColumns}
          onRowsChange={setRows}
        />
      </div>
    </AdminDialog>
  );
}
