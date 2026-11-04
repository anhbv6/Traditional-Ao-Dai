"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Shirt } from "lucide-react";
import { useNotify } from "@/hooks/useNotify";
import { AdminFilterSelect, AdminListPanel, AdminSecondaryButton } from "@/features/admin/core/ui";
import { type AdminProductCategory, type AdminProductItem } from "../../types/products.types";
import {
  bulkSetProductsActiveAction,
  toggleProductActiveAction,
  toggleProductCustomFitAction,
} from "../../actions/products.actions";
import { matchesStatusTab, PRODUCT_STATUS_TABS, type ProductStatusTab } from "../../utils/products.utils";
import { SALE_MODES, type SaleMode } from "../../utils/saleModes";
import { ProductsTable } from "./ProductsTable";

const CreateProductDialog = dynamic(() => import("./CreateProductDialog").then((m) => m.CreateProductDialog));

interface ProductsListProps {
  initialProducts: AdminProductItem[];
  categories: AdminProductCategory[];
}

/**
 * Màn danh sách sản phẩm: lọc theo trạng thái, loại sản phẩm (gồm cả loại con khi chọn nhóm gốc) và hình thức bán;
 * thêm mới qua dialog rồi sang màn chi tiết
 */
export function ProductsList({ initialProducts, categories }: ProductsListProps) {
  const t = useTranslations("AdminPage.products");
  const tPage = useTranslations("AdminPage.pages.products");
  const notify = useNotify();
  const [products, setProducts] = useState(initialProducts);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState<ProductStatusTab>("ALL");
  const [categoryId, setCategoryId] = useState("");
  const [saleMode, setSaleMode] = useState<"" | SaleMode>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Chọn nhóm gốc thì gồm cả các loại con bên dưới (nhãn loại con dạng "Gốc › Con")
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const categoryIds = selectedCategory
    ? new Set(
        categories
          .filter((c) => c.id === categoryId || c.label.startsWith(`${selectedCategory.label} › `))
          .map((c) => c.id)
      )
    : null;

  const keyword = searchTerm.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      (!keyword ||
        `${p.name} ${p.code} ${p.materialName ?? ""} ${p.categoryName ?? ""}`.toLowerCase().includes(keyword)) &&
      matchesStatusTab(p, statusTab) &&
      (!categoryIds || categoryIds.has(p.categoryId)) &&
      (!saleMode || p.saleMode === saleMode)
  );

  // Chỉ tính dòng đang hiển thị: sản phẩm đã bị lọc mất không được đổi ngầm khi bấm thao tác hàng loạt
  const selectedProducts = filtered.filter((p) => selectedIds.has(p.id));

  const replaceProduct = (saved: AdminProductItem | null) => {
    if (saved) setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
  };

  const handleToggleActive = ({ id, isActive }: AdminProductItem) =>
    startTransition(async () => {
      const res = await toggleProductActiveAction(id, !isActive);
      if (!res.success) {
        notify.error(res.error, "PRODUCT_UPDATE_FAILED");
        return;
      }
      replaceProduct(res.data);
    });

  const handleToggleCustomFit = ({ id, isCustomFit }: AdminProductItem) =>
    startTransition(async () => {
      const res = await toggleProductCustomFitAction(id, !isCustomFit);
      if (!res.success) {
        notify.error(res.error, "PRODUCT_UPDATE_FAILED");
        return;
      }
      replaceProduct(res.data);
    });

  const handleBulkActive = (isActive: boolean) => {
    const productIds = selectedProducts.map((p) => p.id);
    startTransition(async () => {
      const res = await bulkSetProductsActiveAction({ productIds, isActive });
      if (!res.success) {
        notify.error(res.error, "PRODUCT_UPDATE_FAILED");
        return;
      }
      setProducts((prev) => prev.map((p) => (productIds.includes(p.id) ? { ...p, isActive } : p)));
      setSelectedIds(new Set());
    });
  };

  return (
    <>
      <AdminListPanel
        icon={Shirt}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: t("searchPlaceholder") }}
        action={{ label: t("add"), onClick: () => setIsCreating(true) }}
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
              value={categoryId}
              onChange={setCategoryId}
              options={[
                { value: "", label: t("allCategories") },
                ...categories.map((c) => ({ value: c.id, label: c.label })),
              ]}
              className="w-full sm:w-64"
            />
            <AdminFilterSelect
              label={t("field.saleMode")}
              value={saleMode}
              onChange={setSaleMode}
              options={[
                { value: "" as const, label: t("allModes") },
                ...SALE_MODES.map((mode) => ({ value: mode, label: t(`mode.${mode}.label`) })),
              ]}
              className="w-full sm:w-56"
            />
          </>
        }
      />

      <ProductsTable
        products={filtered}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        disabled={isPending}
        empty={products.length === 0 ? t("empty") : t("noResults")}
        onToggleActive={handleToggleActive}
        onToggleCustomFit={handleToggleCustomFit}
        bulkActions={
          <>
            <AdminSecondaryButton disabled={isPending} onClick={() => handleBulkActive(true)}>
              {t("showProduct")}
            </AdminSecondaryButton>
            <AdminSecondaryButton disabled={isPending} onClick={() => handleBulkActive(false)}>
              {t("hideProduct")}
            </AdminSecondaryButton>
            <AdminSecondaryButton disabled={isPending} onClick={() => setSelectedIds(new Set())}>
              {t("clearSelection")}
            </AdminSecondaryButton>
          </>
        }
      />

      {isCreating && <CreateProductDialog categories={categories} onOpenChange={setIsCreating} />}
    </>
  );
}
