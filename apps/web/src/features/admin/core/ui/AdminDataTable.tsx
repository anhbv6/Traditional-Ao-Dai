"use client";

import { type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "./AdminPage";

/** Checkbox đơn sắc theo quy chuẩn admin (mặc định của ui/checkbox là màu thương hiệu storefront) */
export function AdminCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Checkbox
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={onChange}
      aria-label={label}
      disabled={disabled}
      className="size-[18px] rounded-[5px] border-[#D4D4D8] bg-white shadow-none hover:border-[#18181B] focus-visible:border-[#18181B] focus-visible:ring-[#18181B]/15 data-checked:border-[#18181B] data-checked:bg-[#18181B]"
    />
  );
}

const STATUS_DOT_CLASS = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "bg-[#A1A1AA]",
} as const;

export type AdminStatusTone = keyof typeof STATUS_DOT_CLASS;

/** Trạng thái dạng chấm màu + chữ — kiểu hiển thị trạng thái trong AdminDataTable (không dùng pill nền màu) */
export function AdminStatusText({ tone, children }: { tone: AdminStatusTone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[#3F3F46]">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_CLASS[tone])} />
      {children}
    </span>
  );
}

/** Nút icon của cột thao tác (thường là nút ⋯ mở menu) */
export const ADMIN_ROW_ICON_BUTTON_CLASS =
  "grid size-9 cursor-pointer place-items-center rounded-lg text-[#71717A] outline-none transition-colors hover:bg-[#E4E4E7]/70 hover:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/15 disabled:cursor-not-allowed disabled:opacity-50 data-popup-open:bg-[#E4E4E7]/70 data-popup-open:text-[#09090B]";

export interface AdminTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Áp cho cả th và td — dùng cho độ rộng hoặc ẩn theo breakpoint (`hidden xl:table-cell`) */
  className?: string;
}

interface AdminDataTableProps<T> {
  rows: T[];
  columns: AdminTableColumn<T>[];
  getRowId: (row: T) => string;
  /** Chọn nhiều dòng — có thì hiện cột checkbox; khi đã chọn, thanh thao tác hàng loạt đè lên hàng tiêu đề */
  selection?: {
    selectedIds: Set<string>;
    onChange: (ids: Set<string>) => void;
    selectAllLabel: string;
    rowLabel: (row: T) => string;
    /** Nội dung bên trái thanh hàng loạt, ví dụ "Đã chọn 3 sản phẩm" */
    summary: (count: number) => ReactNode;
    /** Các nút thao tác hàng loạt */
    actions: ReactNode;
  };
  /** Thao tác cuối dòng — một nút ⋯ (menu) gom mọi thao tác, luôn hiện */
  rowActions?: (row: T) => ReactNode;
  /** Nhãn ẩn cho cột thao tác (đọc màn hình) */
  actionsLabel?: string;
  /** Bố cục một dòng ở màn nhỏ (dưới `md`) — bỏ trống thì màn nhỏ cuộn ngang bảng */
  mobileRow?: (row: T) => ReactNode;
  /** Hiện khi `rows` rỗng */
  empty?: ReactNode;
  /** Bề rộng tối thiểu của bảng trước khi cuộn ngang */
  minWidth?: number;
}

const CELL_X = "px-3 first:pl-2 last:pr-2";

/**
 * Bảng danh sách chuẩn của admin — nằm trong thẻ trắng cùng kiểu AdminListPanel, tiêu đề cột và các dòng ngăn bằng nét đứt,
 * chữ 15px, dòng cao, hàng rê chuột tô nền nhạt. Mọi màn danh sách dùng bảng này thay vì tự viết `<table>`.
 */
export function AdminDataTable<T>({
  rows,
  columns,
  getRowId,
  selection,
  rowActions,
  actionsLabel,
  mobileRow,
  empty,
  minWidth = 720,
}: AdminDataTableProps<T>) {
  if (rows.length === 0) {
    return empty ? (
      <section className={cn(ADMIN_CARD_CLASS, "py-20 text-center text-body text-[#71717A]")}>{empty}</section>
    ) : null;
  }

  const selectedCount = selection ? rows.filter((row) => selection.selectedIds.has(getRowId(row))).length : 0;

  const toggleRow = (id: string, checked: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    selection.onChange(next);
  };

  const toggleAll = (checked: boolean) => selection?.onChange(checked ? new Set(rows.map(getRowId)) : new Set());

  const rowCheckbox = (row: T) =>
    selection && (
      <AdminCheckbox
        checked={selection.selectedIds.has(getRowId(row))}
        onChange={(checked) => toggleRow(getRowId(row), checked)}
        label={selection.rowLabel(row)}
      />
    );

  return (
    <section className={cn(ADMIN_CARD_CLASS, "px-3 py-2 sm:px-4")}>
      <div className={cn("relative overflow-x-auto", mobileRow && "hidden md:block")}>
        {selection && selectedCount > 0 && (
          // Thanh hàng loạt đè lên hàng tiêu đề (không thay cột) để độ rộng cột và vị trí bảng giữ nguyên khi chọn dòng
          <div className="absolute inset-x-0 top-0 z-10 ml-12 flex h-12 items-center gap-2 border-b border-dashed border-[#E4E4E7] bg-white pl-4 pr-2">
            <span className="mr-auto truncate text-sm font-medium text-[#09090B]">
              {selection.summary(selectedCount)}
            </span>
            {selection.actions}
          </div>
        )}
        <table className="w-full border-separate border-spacing-0 text-body" style={{ minWidth }}>
          <thead>
            <tr className="h-12">
              {selection && (
                <th className="w-12 border-b border-dashed border-[#E4E4E7] pl-2 pr-1">
                  <span className="flex">
                    <AdminCheckbox
                      checked={selectedCount === rows.length}
                      indeterminate={selectedCount > 0 && selectedCount < rows.length}
                      onChange={toggleAll}
                      label={selection.selectAllLabel}
                    />
                  </span>
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap border-b border-dashed border-[#E4E4E7] text-body font-semibold text-[#3F3F46]",
                    CELL_X,
                    column.align === "right" ? "text-right" : "text-left",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
              {rowActions && (
                <th className={cn("border-b border-dashed border-[#E4E4E7]", CELL_X)}>
                  <span className="sr-only">{actionsLabel}</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = getRowId(row);
              const isSelected = selection?.selectedIds.has(id) ?? false;
              return (
                <tr
                  key={id}
                  data-selected={isSelected || undefined}
                  className="group/row transition-colors hover:bg-[#FAFAFA] data-selected:bg-[#F4F4F5]/70 [&>td]:border-b [&>td]:border-dashed [&>td]:border-[#E4E4E7] last:[&>td]:border-b-0 [&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl"
                >
                  {selection && (
                    <td className="py-4 pl-2 pr-1">
                      <span className="flex">{rowCheckbox(row)}</span>
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("py-4", CELL_X, column.align === "right" && "text-right", column.className)}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className={cn("w-px whitespace-nowrap py-4", CELL_X)}>
                      <div className="flex items-center justify-end">{rowActions(row)}</div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {mobileRow && (
        <ul className="divide-y divide-dashed divide-[#E4E4E7] md:hidden">
          {selection && selectedCount > 0 && (
            <li className="flex flex-wrap items-center gap-2 py-3">
              <span className="mr-auto text-sm font-medium text-[#09090B]">{selection.summary(selectedCount)}</span>
              {selection.actions}
            </li>
          )}
          {rows.map((row) => (
            <li key={getRowId(row)} className="flex items-start gap-3 py-4">
              {selection && <span className="flex pt-1">{rowCheckbox(row)}</span>}
              <div className="min-w-0 flex-1">{mobileRow(row)}</div>
              {rowActions && <div className="flex shrink-0 items-center">{rowActions(row)}</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
