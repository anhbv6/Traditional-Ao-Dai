"use client";

import { useState } from "react";
import { AlertTriangle, Ruler } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ProductGroup } from "@repo/shared/sizing";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
} from "@/features/admin/core/ui";
import {
  SizeChartGrid,
  collectGridIssues,
  rowHasMeasurement,
  type SizeChartColumnValue,
  type SizeChartRowValue,
} from "@/features/admin/modules/size-charts";

export interface CategorySizeChartGrid {
  columns: SizeChartColumnValue[];
  rows: SizeChartRowValue[];
}

/** Bảng đã nhập đủ: có cột, có hàng, không lỗi ô và hàng nào cũng có số đo */
export function isSizeChartGridComplete(grid: CategorySizeChartGrid | null): grid is CategorySizeChartGrid {
  return (
    grid !== null &&
    grid.columns.length > 0 &&
    grid.rows.length > 0 &&
    collectGridIssues(grid.columns, grid.rows).total === 0 &&
    grid.rows.every(rowHasMeasurement)
  );
}

interface CategorySizeChartDialogProps {
  group: ProductGroup;
  /** Tên loại sản phẩm đang thêm — hiện ở tiêu đề */
  typeName: string;
  initial: CategorySizeChartGrid;
  onCancel: () => void;
  onDone: (grid: CategorySizeChartGrid) => void;
}

/**
 * Nhập bảng size riêng ngay khi thêm loại sản phẩm (không phải lưu rồi mới sang màn bảng size):
 * dùng lại lưới của trình soạn bảng size — chọn thông số, nhập khoảng min–max, dán từ Excel.
 * Bảng chỉ lưu cùng loại sản phẩm khi bấm "Thêm loại".
 */
export function CategorySizeChartDialog({ group, typeName, initial, onCancel, onDone }: CategorySizeChartDialogProps) {
  const t = useTranslations("AdminPage.categories.editor.sizeDialog");
  const [columns, setColumns] = useState(initial.columns);
  const [rows, setRows] = useState(initial.rows);
  const [showMissing, setShowMissing] = useState(false);

  const issues = collectGridIssues(columns, rows);
  const emptyRows = rows.filter((row) => !rowHasMeasurement(row)).length;

  const finish = () => {
    const grid = { columns, rows };
    if (!isSizeChartGridComplete(grid)) {
      setShowMissing(true);
      return;
    }
    onDone(grid);
  };

  return (
    <AdminDialog
      open
      onOpenChange={(open) => !open && onCancel()}
      icon={Ruler}
      title={typeName.trim() ? t("titleNamed", { name: typeName.trim() }) : t("title")}
      description={t("description")}
      size="5xl"
      footer={
        <>
          {showMissing && (issues.total > 0 || emptyRows > 0 || rows.length === 0 || columns.length === 0) && (
            <p role="alert" className="mr-auto flex items-center gap-1.5 text-xs text-rose-600">
              <AlertTriangle size={13} aria-hidden />
              {issues.total > 0
                ? t("issues", { count: issues.total })
                : columns.length === 0 || rows.length === 0
                  ? t("empty")
                  : t("missingRows", { count: emptyRows })}
            </p>
          )}
          <button type="button" onClick={onCancel} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button type="button" onClick={finish} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {t("done")}
          </button>
        </>
      }
    >
      <SizeChartGrid
        group={group}
        columns={columns}
        rows={rows}
        issues={issues}
        onColumnsChange={setColumns}
        onRowsChange={setRows}
      />
    </AdminDialog>
  );
}
