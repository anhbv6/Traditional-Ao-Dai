"use client";

import { useMemo, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-[#3F3F46]">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_CLASS[tone])} />
      {children}
    </span>
  );
}

/** Nút icon của cột thao tác (thường là nút ⋯ mở menu) */
export const ADMIN_ROW_ICON_BUTTON_CLASS =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-[#71717A] outline-none transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/15 disabled:cursor-not-allowed disabled:opacity-50 data-popup-open:bg-[#F4F4F5] data-popup-open:text-[#09090B]";

export interface AdminTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Áp cho cả th và td — độ rộng hoặc ẩn theo bề rộng bảng (`hidden @4xl:table-cell` — thẻ bảng là container) hay breakpoint màn hình */
  className?: string;
}

export interface AdminTablePagination {
  /** Trang hiện tại (bắt đầu từ 1) */
  page: number;
  /** Số dòng trên một trang */
  pageSize: number;
  /** Tổng số dòng dữ liệu. Nếu không truyền, mặc định tính theo rows.length */
  totalItems?: number;
  /** Callback khi chuyển trang */
  onPageChange: (page: number) => void;
  /** Các tùy chọn số dòng/trang, ví dụ [10, 20, 50] */
  pageSizeOptions?: number[];
  /** Callback khi đổi số dòng/trang */
  onPageSizeChange?: (pageSize: number) => void;
  /** Tự động slice rows nếu là phân trang client-side (mặc định: true nếu totalItems bằng rows.length hoặc không truyền) */
  clientSide?: boolean;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
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
  /** Dòng đang được trỏ từ nơi khác (vd sơ đồ đi kèm) — tô nền như dòng đang rê chuột */
  activeRowId?: string | null;
  /** Rê chuột vào / ra một dòng (null khi rời) — để đồng bộ với thành phần đi kèm */
  onRowHover?: (row: T | null) => void;
  className?: string;
  /** Banner hiển thị phía trên bảng (bên trong card bo góc) — ví dụ tiêu chí sắp xếp */
  topBanner?: ReactNode;
  /** Cấu hình phân trang tích hợp sẵn */
  pagination?: AdminTablePagination;
}

/**
 * Bảng danh sách chuẩn của admin — thẻ bo góc tràn viền (overflow-hidden) theo ma trận chuẩn mực,
 * tiêu đề cột nền xám nhẹ `#FAFAFA]/80` chữ 12px, các dòng ngăn cách bằng nét đứt `#E4E4E7`,
 * rê chuột đổi nền `#FAFAFA` mượt mà, hỗ trợ trọn vẹn chọn hàng loạt (checkbox), menu thao tác ⋯ và phân trang tích hợp sẵn.
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
  activeRowId,
  onRowHover,
  className,
  topBanner,
  pagination,
}: AdminDataTableProps<T>) {
  const t = useTranslations("AdminPage");
  const locale = useLocale();

  const isClientSide =
    pagination?.clientSide ??
    (pagination ? pagination.totalItems === undefined || pagination.totalItems === rows.length : false);
  const totalItems = pagination?.totalItems ?? rows.length;
  const pageSize = pagination?.pageSize ?? rows.length;
  const currentPage = pagination?.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 1)));

  const displayedRows = useMemo(() => {
    if (!pagination || !isClientSide) return rows;
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, pagination, isClientSide, currentPage, pageSize]);

  if (rows.length === 0) {
    return empty ? (
      <section className={cn(ADMIN_CARD_CLASS, "py-20 text-center text-body text-[#71717A]", className)}>{empty}</section>
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
    <section className={cn(ADMIN_CARD_CLASS, "@container overflow-hidden", className)}>
      {topBanner}

      <div className={cn("relative overflow-x-auto", mobileRow && "hidden md:block")}>
        {selection && selectedCount > 0 && (
          // Thanh hàng loạt đè lên hàng tiêu đề để độ rộng cột và vị trí bảng giữ nguyên khi chọn dòng
          <div className="absolute inset-x-0 top-0 z-10 flex h-11 items-center gap-3 border-b border-dashed border-[#E4E4E7] bg-white px-4">
            <span className="flex">
              <AdminCheckbox
                checked={selectedCount === rows.length}
                indeterminate={selectedCount > 0 && selectedCount < rows.length}
                onChange={toggleAll}
                label={selection.selectAllLabel}
              />
            </span>
            <span className="mr-auto truncate text-xs font-medium text-[#09090B]">
              {selection.summary(selectedCount)}
            </span>
            <div className="flex items-center gap-2">{selection.actions}</div>
          </div>
        )}
        <table className="w-full border-separate border-spacing-0 text-body" style={{ minWidth }}>
          <thead>
            <tr className="h-11 bg-[#FAFAFA]/80 text-xs font-medium text-[#71717A]">
              {selection && (
                <th className="w-12 border-b border-dashed border-[#E4E4E7] pl-4 pr-1 text-left">
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
              {columns.map((column, index) => {
                const isFirst = !selection && index === 0;
                const isLast = !rowActions && index === columns.length - 1;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "whitespace-nowrap border-b border-dashed border-[#E4E4E7] px-3 py-2.5 text-xs font-medium text-[#71717A]",
                      isFirst && "pl-4",
                      isLast && "pr-4",
                      column.align === "right" ? "text-right" : "text-left",
                      column.className
                    )}
                  >
                    {column.header}
                  </th>
                );
              })}
              {rowActions && (
                <th className="w-12 border-b border-dashed border-[#E4E4E7] pl-1 pr-4 text-right">
                  <span className="sr-only">{actionsLabel}</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row) => {
              const id = getRowId(row);
              const isSelected = selection?.selectedIds.has(id) ?? false;
              return (
                <tr
                  key={id}
                  data-selected={isSelected || undefined}
                  data-active={activeRowId === id || undefined}
                  onMouseEnter={onRowHover && (() => onRowHover(row))}
                  onMouseLeave={onRowHover && (() => onRowHover(null))}
                  className="group/row transition-colors hover:bg-[#FAFAFA] data-active:bg-[#F4F4F5] data-selected:bg-[#F4F4F5]/70 [&>td]:border-b [&>td]:border-dashed [&>td]:border-[#E4E4E7] last:[&>td]:border-b-0"
                >
                  {selection && (
                    <td className="py-3.5 pl-4 pr-1">
                      <span className="flex">{rowCheckbox(row)}</span>
                    </td>
                  )}
                  {columns.map((column, index) => {
                    const isFirst = !selection && index === 0;
                    const isLast = !rowActions && index === columns.length - 1;
                    return (
                      <td
                        key={column.key}
                        className={cn(
                          "py-3.5 px-3",
                          isFirst && "pl-4",
                          isLast && "pr-4",
                          column.align === "right" && "text-right",
                          column.className
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    );
                  })}
                  {rowActions && (
                    <td className="w-12 whitespace-nowrap py-3.5 pl-1 pr-4 text-right">
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
            <li className="flex flex-wrap items-center gap-2 bg-[#FAFAFA] px-4 py-2.5">
              <span className="mr-auto text-xs font-medium text-[#09090B]">{selection.summary(selectedCount)}</span>
              <div className="flex items-center gap-2">{selection.actions}</div>
            </li>
          )}
          {displayedRows.map((row) => (
            <li key={getRowId(row)} className="flex items-start gap-3 px-4 py-3.5">
              {selection && <span className="flex pt-1">{rowCheckbox(row)}</span>}
              <div className="min-w-0 flex-1">{mobileRow(row)}</div>
              {rowActions && <div className="flex shrink-0 items-center">{rowActions(row)}</div>}
            </li>
          ))}
        </ul>
      )}

      {/* Thanh phân trang tích hợp chuẩn mực */}
      {pagination && totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[#E4E4E7] bg-[#FAFAFA]/70 px-4 py-3 text-xs text-[#71717A]">
          <div className="flex items-center gap-3">
            <span>
              {t("pagination.showing", {
                from: Math.min(totalItems, (currentPage - 1) * pageSize + 1).toLocaleString(
                  locale === "vi" ? "vi-VN" : "en-US"
                ),
                to: Math.min(totalItems, currentPage * pageSize).toLocaleString(locale === "vi" ? "vi-VN" : "en-US"),
                total: totalItems.toLocaleString(locale === "vi" ? "vi-VN" : "en-US"),
              })}
            </span>

            {pagination.pageSizeOptions && pagination.onPageSizeChange && (
              <div className="flex items-center gap-1.5 border-l border-dashed border-[#E4E4E7] pl-3">
                <span className="text-2xs text-[#71717A]">{t("pagination.perPage")}:</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
                  aria-label={t("pagination.perPage")}
                  className="h-7 cursor-pointer rounded-md border border-[#E4E4E7] bg-white px-2 font-mono text-xs text-[#09090B] outline-none transition-colors hover:border-[#A1A1AA] focus:border-[#18181B]"
                >
                  {pagination.pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => pagination.onPageChange(currentPage - 1)}
                aria-label={t("pagination.prev")}
                className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-xs font-medium text-[#3F3F46] transition-colors hover:border-[#A1A1AA] hover:text-[#09090B] disabled:cursor-not-allowed disabled:border-[#E4E4E7]/60 disabled:bg-[#FAFAFA] disabled:text-[#A1A1AA]"
              >
                <ChevronLeft size={14} aria-hidden />
                <span className="hidden sm:inline">{t("pagination.prev")}</span>
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                  p === "..." ? (
                    <span key={`dots-${idx}`} className="grid size-8 place-items-center text-xs text-[#A1A1AA]">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      aria-current={p === currentPage ? "page" : undefined}
                      onClick={() => pagination.onPageChange(p as number)}
                      className={cn(
                        "grid size-8 cursor-pointer place-items-center rounded-lg font-mono text-xs font-medium transition-colors",
                        p === currentPage
                          ? "border border-[#18181B] bg-[#18181B] font-semibold text-white shadow-2xs"
                          : "border border-[#E4E4E7] bg-white text-[#3F3F46] hover:border-[#A1A1AA] hover:text-[#09090B]"
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => pagination.onPageChange(currentPage + 1)}
                aria-label={t("pagination.next")}
                className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-xs font-medium text-[#3F3F46] transition-colors hover:border-[#A1A1AA] hover:text-[#09090B] disabled:cursor-not-allowed disabled:border-[#E4E4E7]/60 disabled:bg-[#FAFAFA] disabled:text-[#A1A1AA]"
              >
                <span className="hidden sm:inline">{t("pagination.next")}</span>
                <ChevronRight size={14} aria-hidden />
              </button>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
