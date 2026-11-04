"use client";

import { type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { AdminDataTable, type AdminTableColumn } from "@/features/admin/core/ui";
import { type AdminProductItem } from "../../types/products.types";
import { ProductIdentity, ProductRowActions, ProductStatus, ProductStockCell } from "./ProductRowParts";

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
}

/** Bảng sản phẩm theo AdminDataTable — bấm tên để mở màn chi tiết; loại, chất liệu, hình thức bán gộp dưới tên */
export function ProductsTable({
  products,
  selectedIds,
  onSelectionChange,
  bulkActions,
  disabled,
  empty,
  onToggleActive,
  onToggleCustomFit,
}: ProductsTableProps) {
  const t = useTranslations("AdminPage.products");
  const locale = useLocale() as Locale;
  const price = (product: AdminProductItem) => (product.basePrice > 0 ? formatVnd(product.basePrice, locale) : "—");

  const columns: AdminTableColumn<AdminProductItem>[] = [
    { key: "product", header: t("colProduct"), cell: (p) => <ProductIdentity product={p} />, className: "min-w-[280px]" },
    {
      key: "price",
      header: t("colPrice"),
      align: "right",
      className: "w-36 whitespace-nowrap",
      cell: (p) => <span className="font-medium tabular-nums text-[#09090B]">{price(p)}</span>,
    },
    { key: "stock", header: t("colStock"), align: "right", className: "w-32", cell: (p) => <ProductStockCell product={p} /> },
    { key: "status", header: t("colStatus"), className: "w-32", cell: (p) => <ProductStatus isActive={p.isActive} /> },
  ];

  return (
    <AdminDataTable
      rows={products}
      columns={columns}
      getRowId={(p) => p.id}
      empty={empty}
      actionsLabel={t("colActions")}
      selection={{
        selectedIds,
        onChange: onSelectionChange,
        selectAllLabel: t("selectAll"),
        rowLabel: (p) => t("selectProduct", { name: p.name }),
        summary: (count) => t("selectedCount", { count }),
        actions: bulkActions,
      }}
      rowActions={(p) => (
        <ProductRowActions
          product={p}
          disabled={disabled}
          onToggleActive={onToggleActive}
          onToggleCustomFit={onToggleCustomFit}
        />
      )}
      mobileRow={(p) => (
        <div className="space-y-2">
          <ProductIdentity product={p} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-16 text-sm">
            <span className="font-medium tabular-nums text-[#09090B]">{price(p)}</span>
            <ProductStockCell product={p} />
            <ProductStatus isActive={p.isActive} />
          </div>
        </div>
      )}
    />
  );
}
