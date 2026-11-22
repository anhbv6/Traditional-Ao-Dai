"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { AdminDataTable, type AdminTableColumn } from "@/features/admin/core/ui";
import { type AdminProductItem } from "../../types/products.types";
import {
  ProductCategoryCell,
  ProductIdentity,
  ProductRowActions,
  ProductSaleModeCell,
  ProductStatus,
  ProductStockCell,
  resolveCategoryName,
  resolveProductName,
} from "./ProductRowParts";

interface ProductsTableProps {
  products: AdminProductItem[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  /** Nút thao tác hàng loạt khi có dòng được chọn */
  bulkActions: ReactNode;
  disabled: boolean;
  empty: ReactNode;
  onToggleActive: (product: AdminProductItem) => void;
  onToggleCustomFit: (product: AdminProductItem) => void;
  onPreview: (product: AdminProductItem) => void;
}

/**
 * Bảng sản phẩm theo AdminDataTable:
 * - Phân chia cột khoa học, rõ ràng: Sản phẩm (ảnh + tên + mã) › Loại sản phẩm › Hình thức bán › Giá › Tồn kho › Trạng thái.
 * - Loại bỏ toàn bộ icon màu mè, chuẩn hóa typography và hiển thị đa ngữ theo đúng ngôn ngữ trang web.
 */
export function ProductsTable({
  products,
  selectedIds,
  onSelectionChange,
  bulkActions,
  disabled,
  empty,
  onToggleActive,
  onToggleCustomFit,
  onPreview,
}: ProductsTableProps) {
  const t = useTranslations("AdminPage.products");
  const locale = useLocale() as Locale;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const price = (product: AdminProductItem) => (product.basePrice > 0 ? formatVnd(product.basePrice, locale) : "—");

  const columns: AdminTableColumn<AdminProductItem>[] = [
    {
      key: "product",
      header: t("colProduct"),
      cell: (p) => <ProductIdentity product={p} />,
      className: "min-w-[260px]",
    },
    {
      key: "category",
      header: t("colCategory"),
      cell: (p) => <ProductCategoryCell product={p} />,
      className: "w-44 min-w-0",
    },
    {
      key: "saleMode",
      header: t("field.saleMode"),
      cell: (p) => <ProductSaleModeCell product={p} />,
      className: "w-36 min-w-0",
    },
    {
      key: "price",
      header: t("colPrice"),
      className: "w-36 min-w-0",
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold tabular-nums text-[#09090B]">
            {price(p)}
          </p>
          <p className="mt-0.5 truncate text-xs invisible select-none">—</p>
        </div>
      ),
    },
    {
      key: "stock",
      header: t("colStock"),
      className: "w-32 min-w-0",
      cell: (p) => <ProductStockCell product={p} />,
    },
    {
      key: "status",
      header: t("colStatus"),
      className: "w-32 min-w-0",
      cell: (p) => <ProductStatus isActive={p.isActive} />,
    },
  ];

  return (
    <AdminDataTable
      rows={products}
      columns={columns}
      getRowId={(p) => p.id}
      empty={empty}
      actionsLabel={t("colActions")}
      minWidth={840}
      selection={{
        selectedIds,
        onChange: onSelectionChange,
        selectAllLabel: t("selectAll"),
        rowLabel: (p) => t("selectProduct", { name: resolveProductName(p, locale) }),
        summary: (count) => t("selectedCount", { count }),
        actions: bulkActions,
      }}
      rowActions={(p) => (
        <ProductRowActions
          product={p}
          disabled={disabled}
          onToggleActive={onToggleActive}
          onToggleCustomFit={onToggleCustomFit}
          onPreview={onPreview}
        />
      )}
      mobileRow={(p) => (
        <div className="space-y-2 py-1">
          <div className="flex items-start justify-between gap-3">
            <ProductIdentity product={p} />
            <div className="shrink-0">
              <ProductStatus isActive={p.isActive} inline />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pl-[56px] text-xs text-[#71717A]">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#27272A]">{resolveCategoryName(p, locale) || "—"}</span>
              <span>·</span>
              <ProductSaleModeCell product={p} inline />
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-medium tabular-nums text-[#09090B]">{price(p)}</span>
              <ProductStockCell product={p} inline />
            </div>
          </div>
        </div>
      )}
      pagination={{
        page,
        pageSize,
        onPageChange: setPage,
        pageSizeOptions: [10, 20, 50],
        onPageSizeChange: (size) => {
          setPageSize(size);
          setPage(1);
        },
      }}
    />
  );
}
