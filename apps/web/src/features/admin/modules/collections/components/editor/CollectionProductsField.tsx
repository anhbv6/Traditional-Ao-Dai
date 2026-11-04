"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, PackagePlus, PackageX, Plus, Search, Shirt, Star, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
} from "@/features/admin/core/ui";
import { type AdminCollectionProduct, type CollectionPickerProduct } from "../../types/collections.types";
import { MAX_COLLECTION_PRODUCTS, MAX_HIGHLIGHTED_PRODUCTS } from "../../utils/collectionLifecycle";
import { CollectionStatusBadge } from "../shared/CollectionStatusBadge";

interface CollectionProductsFieldProps {
  collectionId: string;
  value: AdminCollectionProduct[];
  onChange: (value: AdminCollectionProduct[]) => void;
  productsById: Map<string, CollectionPickerProduct>;
  allProducts: CollectionPickerProduct[];
  autoPushOosToBottom: boolean;
}

function Thumb({ image, className }: { image: string | null; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-md bg-[#F4F4F5]", className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
        <img src={image} alt="" className="size-full object-contain" />
      ) : (
        <Shirt size={16} className="text-[#A1A1AA]" aria-hidden />
      )}
    </span>
  );
}

/**
 * Sản phẩm của bộ sưu tập: thứ tự hiển thị, đánh dấu nổi bật, và nhãn cho các case cần biết
 * (đang ẩn, chưa đủ điều kiện mở bán, hết hàng, đồng thời thuộc bộ sưu tập khác).
 */
export function CollectionProductsField({
  collectionId,
  value,
  onChange,
  productsById,
  allProducts,
  autoPushOosToBottom,
}: CollectionProductsFieldProps) {
  const t = useTranslations("AdminPage.collections.products");
  const tCollections = useTranslations("AdminPage.collections");
  const locale = useLocale() as Locale;
  const [isPicking, setIsPicking] = useState(false);

  const highlightedCount = value.filter((item) => item.isHighlighted).length;
  const selling = value.filter((item) => productsById.get(item.productId)?.isActive).length;

  const move = (index: number, delta: number) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#71717A]">
        <span className="tabular-nums">
          {t("summary", { count: value.length, selling, highlighted: highlightedCount })}
        </span>
        <button
          type="button"
          onClick={() => setIsPicking(true)}
          className="ml-auto inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm font-medium text-[#3F3F46] shadow-2xs transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B]"
        >
          <Plus size={15} aria-hidden /> {t("add")}
        </button>
      </div>

      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => setIsPicking(true)}
          className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-[#D4D4D8] px-4 py-10 text-sm text-[#71717A] transition-colors hover:bg-[#FAFAFA]"
        >
          <Plus size={18} aria-hidden />
          {t("empty")}
        </button>
      ) : (
        <ol className="divide-y divide-[#F4F4F5] rounded-lg border border-[#E4E4E7]">
          {value.map((item, index) => {
            const product = productsById.get(item.productId);
            if (!product) return null;
            const others = product.collections.filter((c) => c.id !== collectionId);
            const outOfStock = product.totalStock <= 0;

            return (
              <li key={item.productId} className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-5 shrink-0 text-center text-xs tabular-nums text-[#A1A1AA]">{index + 1}</span>
                <Thumb image={product.image} className="h-12 w-9" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-[#09090B]">{product.name}</span>
                    {item.isHighlighted && (
                      <Star
                        size={13}
                        className="shrink-0 fill-amber-400 text-amber-500"
                        aria-label={t("highlighted")}
                      />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span className="text-xs tabular-nums text-[#52525B]">{formatVnd(product.basePrice, locale)}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-px text-2xs font-medium",
                        product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#F4F4F5] text-[#52525B]"
                      )}
                    >
                      {product.isActive ? t("selling") : t("hidden")}
                    </span>
                    {!product.isActive && !product.isReady && (
                      <span className="rounded bg-amber-50 px-1.5 py-px text-2xs font-medium text-amber-800">
                        {t("notReady")}
                      </span>
                    )}
                    {outOfStock && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-px text-2xs font-medium text-rose-700">
                        <PackageX size={10} aria-hidden />
                        {autoPushOosToBottom ? t("outOfStockPushed") : t("outOfStock")}
                      </span>
                    )}
                    {others.length > 0 && (
                      <span
                        className="truncate text-2xs text-[#71717A]"
                        title={others.map((c) => c.name).join(", ")}
                      >
                        {t("alsoIn", {
                          names: others.map((c) => `${c.name} (${tCollections(`status.${c.status}`)})`).join(", "),
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    aria-pressed={item.isHighlighted}
                    aria-label={t("toggleHighlight")}
                    disabled={!item.isHighlighted && highlightedCount >= MAX_HIGHLIGHTED_PRODUCTS}
                    onClick={() =>
                      onChange(
                        value.map((v) =>
                          v.productId === item.productId ? { ...v, isHighlighted: !v.isHighlighted } : v
                        )
                      )
                    }
                    title={t("highlightHint", { max: MAX_HIGHLIGHTED_PRODUCTS })}
                    className="grid size-8 cursor-pointer place-items-center rounded-md text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Star size={15} className={cn(item.isHighlighted && "fill-amber-400 text-amber-500")} />
                  </button>
                  <button
                    type="button"
                    aria-label={t("moveUp")}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="hidden size-8 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] disabled:opacity-30 sm:grid"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={t("moveDown")}
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                    className="hidden size-8 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] disabled:opacity-30 sm:grid"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={t("remove")}
                    onClick={() => onChange(value.filter((v) => v.productId !== item.productId))}
                    className="grid size-8 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-rose-50 hover:text-rose-700"
                  >
                    <X size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {isPicking && (
        <ProductPickerDialog
          collectionId={collectionId}
          allProducts={allProducts}
          selectedIds={new Set(value.map((v) => v.productId))}
          onClose={() => setIsPicking(false)}
          onAdd={(ids) => {
            onChange(
              [...value, ...ids.map((productId) => ({ productId, isHighlighted: false }))].slice(
                0,
                MAX_COLLECTION_PRODUCTS
              )
            );
            setIsPicking(false);
          }}
        />
      )}
    </div>
  );
}

function ProductPickerDialog({
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
      icon={PackagePlus}
      title={t("pickerTitle")}
      description={t("pickerDescription")}
      size="xl"
      bodyClassName="p-0"
      toolbar={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA]" aria-hidden />
            <input
              autoFocus
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("pickerSearch")}
              aria-label={t("pickerSearch")}
              className="h-9 w-full rounded-lg border border-[#E4E4E7] bg-white pl-8 pr-3 text-sm outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B]"
            />
          </div>
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
