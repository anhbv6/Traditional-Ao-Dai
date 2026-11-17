"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import type { CollectionPickerProduct } from "../../types/collections.types";
import { ADMIN_DIALOG_PRIMARY_BUTTON_CLASS, ADMIN_DIALOG_SECONDARY_BUTTON_CLASS, AdminDialog, AdminSearchInput } from "@/features/admin/core/ui";
import { Thumb } from "../editor/CollectionProductsField";
import { CollectionStatusBadge } from "../shared/CollectionStatusBadge";
import { cn } from "@/lib/utils";

export function ProductPickerDialog({
  collectionId,
  allProducts,
  selectedIds,
  onClose,
  onAdd,
}: {
  collectionId: string;
  allProducts: CollectionPickerProduct[];
  selectedIds: Set<string>;
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}) {
  const t = useTranslations("AdminPage.collections.products");
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  const keyword = search.trim().toLowerCase();
  const candidates = allProducts.filter((p) => {
    if (keyword && !`${p.name} ${p.categoryName ?? ""}`.toLowerCase().includes(keyword)) return false;
    if (onlyFree && p.collections.some((c) => c.id !== collectionId)) return false;
    return true;
  });

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <AdminDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("pickerTitle")}
      description={t("pickerDescription")}
      size="xl"
      bodyClassName="p-0"
      toolbar={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <AdminSearchInput
            autoFocus
            value={search}
            onChange={setSearch}
            placeholder={t("pickerSearch")}
            className="flex-1"
          />
          <label className="flex cursor-pointer items-center gap-2 text-xs text-[#3F3F46]">
            <input
              type="checkbox"
              checked={onlyFree}
              onChange={(e) => setOnlyFree(e.target.checked)}
              className="size-4 accent-[#18181B]"
            />
            {t("pickerOnlyFree")}
          </label>
        </div>
      }
      footer={
        <>
          <span className="mr-auto text-xs tabular-nums text-[#71717A]">
            {t("pickedCount", { count: picked.length })}
          </span>
          <button type="button" onClick={onClose} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => onAdd(picked)}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {t("addPicked")}
          </button>
        </>
      }
    >
      <ul className="divide-y divide-[#F4F4F5]">
        {candidates.length === 0 ? (
          <li className="px-5 py-12 text-center text-sm text-[#71717A]">{t("pickerEmpty")}</li>
        ) : (
          candidates.map((product) => {
            const already = selectedIds.has(product.id);
            const others = product.collections.filter((c) => c.id !== collectionId);
            return (
              <li key={product.id}>
                <label
                  className={cn(
                    "flex items-center gap-3 px-5 py-2.5",
                    already ? "opacity-50" : "cursor-pointer hover:bg-[#FAFAFA]"
                  )}
                >
                  <input
                    type="checkbox"
                    disabled={already}
                    checked={already || picked.includes(product.id)}
                    onChange={() => toggle(product.id)}
                    className="size-4 shrink-0 accent-[#18181B]"
                  />
                  <Thumb image={product.image} className="h-12 w-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#09090B]">{product.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[#71717A]">
                      <span className="tabular-nums">{formatVnd(product.basePrice, locale)}</span>
                      <span>·</span>
                      <span>{product.isActive ? t("selling") : t("hidden")}</span>
                      {others.slice(0, 2).map((c) => (
                        <CollectionStatusBadge key={c.id} status={c.status} className="max-w-[140px] truncate" />
                      ))}
                    </span>
                  </span>
                  {already && <span className="shrink-0 text-xs text-[#71717A]">{t("alreadyAdded")}</span>}
                </label>
              </li>
            );
          })
        )}
      </ul>
    </AdminDialog>
  );
}