"use client";

import React, { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminFilterSelect, AdminPageHeader, AdminSecondaryButton } from "@/features/admin/core/ui";
import { type AdminProductCategory, type AdminProductItem } from "../types/products.types";
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
}

type ProductDialog = { type: "create" } | { type: "edit"; productId: string } | { type: "detail"; productId: string };

/** Dựng danh sách lựa chọn cho bộ lọc: mục "tất cả" (giá trị rỗng) đứng đầu */
const toFilterOptions = (allLabel: string, values: (string | null | undefined)[]) => [
  { value: "", label: allLabel },
  ...uniqueOptions(values).map((value) => ({ value, label: value })),
];

export function ProductsList({ initialProducts, categories }: ProductsListProps) {
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
      <AdminPageHeader
        title={tPage("title")}
        description={tPage("description")}
        actions={
          <button
            type="button"
            onClick={() => setDialog({ type: "create" })}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#18181B] px-3.5 text-sm font-medium text-white shadow-2xs transition-colors hover:bg-[#09090B]"
          >
            <Plus size={16} aria-hidden /> {t("add")}
          </button>
        }
      />

      <div className={cn(ADMIN_CARD_CLASS, "overflow-hidden")}>
        <div
          role="tablist"
          aria-label={t("colStatus")}
          className="flex gap-5 overflow-x-auto border-b border-[#E4E4E7] px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {PRODUCT_STATUS_TABS.map((tab) => {
            const count = products.filter((p) => matchesStatusTab(p, tab)).length;

            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={statusTab === tab}
                onClick={() => setStatusTab(tab)}
                className={cn(
                  "-mb-px flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 py-3 text-sm font-medium outline-none transition-colors",
                  statusTab === tab
                    ? "border-[#18181B] text-[#09090B]"
                    : "border-transparent text-[#71717A] hover:text-[#09090B]"
                )}
              >
                {t(`tabs.${tab}`)}
                <span className="text-xs font-normal tabular-nums text-[#A1A1AA]">{count}</span>
              </button>
            );
          })}
        </div>

        {selectedProducts.length > 0 ? (
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
        ) : (
          <div className="flex flex-col gap-2 border-b border-[#E4E4E7] p-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA]" aria-hidden />
              <input
                type="search"
                aria-label={t("searchPlaceholder")}
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#E4E4E7] bg-white pl-8 pr-3 text-sm text-[#09090B] shadow-2xs outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B]"
              />
            </div>
            <div className="grid gap-2 sm:flex">
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
                className="w-full sm:w-64"
              />
            </div>
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
          onOpenChange={(open) => !open && setDialog(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
