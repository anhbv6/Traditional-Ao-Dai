"use client";

import React, { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Shirt } from "lucide-react";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminFilterSelect, AdminListPanel, AdminSecondaryButton } from "@/features/admin/core/ui";
import { type AdminProductCategory, type AdminProductSizeChart, type AdminProductItem } from "../types/products.types";
import {
  bulkSetProductsActiveAction,
  toggleProductActiveAction,
  toggleProductCustomFitAction,
} from "../actions/products.actions";
import { matchesStatusTab, PRODUCT_STATUS_TABS, uniqueOptions, type ProductStatusTab } from "../utils/products.utils";
import { ProductsTable } from "./ProductsTable";

// Dialog chỉ cần khi thao tác nên tách khỏi bundle đầu trang
const ProductFormDialog = dynamic(() => import("./ProductFormDialog").then((m) => m.ProductFormDialog));
const ProductDetailDialog = dynamic(() => import("./ProductDetailDialog").then((m) => m.ProductDetailDialog));

interface ProductsListProps {
  initialProducts: AdminProductItem[];
  categories: AdminProductCategory[];
  sizeCharts: AdminProductSizeChart[];
}

type ProductDialog = { type: "create" } | { type: "edit"; productId: string } | { type: "detail"; productId: string };

/** Dựng danh sách lựa chọn cho bộ lọc: mục "tất cả" (giá trị rỗng) đứng đầu */
const toFilterOptions = (allLabel: string, values: (string | null | undefined)[]) => [
  { value: "", label: allLabel },
  ...uniqueOptions(values).map((value) => ({ value, label: value })),
];

export function ProductsList({ initialProducts, categories, sizeCharts }: ProductsListProps) {
  const t = useTranslations("AdminPage.products");
  const tPage = useTranslations("AdminPage.pages.products");
  const notify = useNotify();
  const [dialog, setDialog] = useState<ProductDialog | null>(null);
  const [products, setProducts] = useState<AdminProductItem[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState<ProductStatusTab>("ALL");
  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const keyword = searchTerm.trim().toLowerCase();
  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(keyword) ||
      p.material?.toLowerCase().includes(keyword) ||
      p.categoryName?.toLowerCase().includes(keyword);

    return (
      matchesSearch &&
      matchesStatusTab(p, statusTab) &&
      (!category || p.categoryName === category) &&
      (!material || p.material === material)
    );
  });

  // Chỉ tính dòng đang hiển thị: sản phẩm đã bị lọc mất không được đổi ngầm khi bấm thao tác hàng loạt
  const selectedProducts = filtered.filter((p) => selectedIds.has(p.id));

  const patchProducts = (ids: string[], patch: Partial<AdminProductItem>) => {
    setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, ...patch } : p)));
  };

  const handleToggleActive = ({ id, isActive }: AdminProductItem) => {
    startTransition(async () => {
      const res = await toggleProductActiveAction(id, !isActive);
      if (!res.success) {
        notify.error(res.error, "PRODUCT_UPDATE_FAILED");
        return;
      }
      patchProducts([id], { isActive: !isActive });
    });
  };

  const handleToggleCustomFit = ({ id, isCustomFit }: AdminProductItem) => {
    startTransition(async () => {
      const res = await toggleProductCustomFitAction(id, !isCustomFit);
      if (!res.success) {
        notify.error(res.error, "PRODUCT_UPDATE_FAILED");
        return;
      }
      patchProducts([id], { isCustomFit: !isCustomFit });
    });
  };

  const handleBulkActive = (isActive: boolean) => {
    const productIds = selectedProducts.map((p) => p.id);

    startTransition(async () => {
      const res = await bulkSetProductsActiveAction({ productIds, isActive });
      if (!res.success) {
        notify.error(res.error, "PRODUCT_UPDATE_FAILED");
        return;
      }
      patchProducts(productIds, { isActive });
      setSelectedIds(new Set());
    });
  };

  const handleSaved = (saved: AdminProductItem) => {
    setProducts((prev) =>
      prev.some((p) => p.id === saved.id) ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]
    );
    setDialog(null);
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <>
      <AdminListPanel
        icon={Shirt}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: t("searchPlaceholder") }}
        action={{ label: t("add"), onClick: () => setDialog({ type: "create" }) }}
        filters={
          <>
            <AdminFilterSelect
              label={t("colStatus")}
              value={statusTab}
              onChange={setStatusTab}
              options={PRODUCT_STATUS_TABS.map((tab) => ({
                value: tab,
                label: `${t(`tabs.${tab}`)} (${products.filter((p) => matchesStatusTab(p, tab)).length})`,
              }))}
              className="w-full sm:w-52"
            />
            <AdminFilterSelect
              label={t("colCategory")}
              value={category}
              onChange={setCategory}
              options={toFilterOptions(
                t("allCategories"),
                products.map((p) => p.categoryName)
              )}
              className="w-full sm:w-64"
            />
            <AdminFilterSelect
              label={t("colMaterial")}
              value={material}
              onChange={setMaterial}
              options={toFilterOptions(
                t("allMaterials"),
                products.map((p) => p.material)
              )}
              className="w-full sm:w-60"
            />
          </>
        }
      />

      <div className={cn(ADMIN_CARD_CLASS, "overflow-hidden")}>
        {selectedProducts.length > 0 && (
          <div className="flex min-h-[57px] flex-wrap items-center gap-2 border-b border-[#E4E4E7] bg-[#FAFAFA] px-4 py-2.5">
            <span className="mr-auto text-sm font-medium text-[#09090B]">
              {t("selectedCount", { count: selectedProducts.length })}
            </span>
            <AdminSecondaryButton disabled={isPending} onClick={() => handleBulkActive(true)}>
              {t("showProduct")}
            </AdminSecondaryButton>
            <AdminSecondaryButton disabled={isPending} onClick={() => handleBulkActive(false)}>
              {t("hideProduct")}
            </AdminSecondaryButton>
            <AdminSecondaryButton disabled={isPending} onClick={() => setSelectedIds(new Set())}>
              {t("clearSelection")}
            </AdminSecondaryButton>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#71717A]">
            {products.length === 0 ? t("empty") : t("noResults")}
          </p>
        ) : (
          <ProductsTable
            products={filtered}
            selectedIds={selectedIds}
            disabled={isPending}
            onSelectAll={(checked) => setSelectedIds(checked ? new Set(filtered.map((p) => p.id)) : new Set())}
            onSelect={handleSelect}
            onView={({ id }) => setDialog({ type: "detail", productId: id })}
            onEdit={({ id }) => setDialog({ type: "edit", productId: id })}
            onToggleActive={handleToggleActive}
            onToggleCustomFit={handleToggleCustomFit}
          />
        )}
      </div>

      {dialog?.type === "detail" && (
        <ProductDetailDialog
          productId={dialog.productId}
          onOpenChange={(open) => !open && setDialog(null)}
          onEdit={(productId) => setDialog({ type: "edit", productId })}
        />
      )}

      {(dialog?.type === "create" || dialog?.type === "edit") && (
        <ProductFormDialog
          open
          productId={dialog.type === "edit" ? dialog.productId : null}
          categories={categories}
          sizeCharts={sizeCharts}
          onOpenChange={(open) => !open && setDialog(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
