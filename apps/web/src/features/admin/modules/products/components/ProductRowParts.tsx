"use client";

import { Eye, EyeOff, MoreHorizontal, PackageSearch, Pencil, Scissors, Shirt } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppMenu } from "@/components/shared/AppMenu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { type AdminProductItem } from "../types/products.types";

/** Checkbox đơn sắc theo quy chuẩn admin (mặc định của ui/checkbox là màu thương hiệu storefront) */
export function ProductCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <Checkbox
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={onChange}
      aria-label={label}
      className="size-4 rounded-[4px] border-[#D4D4D8] bg-white shadow-none hover:border-[#18181B] focus-visible:border-[#18181B] focus-visible:ring-[#18181B]/15 data-checked:border-[#18181B] data-checked:bg-[#18181B]"
    />
  );
}

/** Ảnh dọc 3:4 — giữ trọn dáng áo, không cắt mất tà */
export function ProductThumb({ product, className }: { product: AdminProductItem; className?: string }) {
  const image = product.images?.[0];

  return (
    <span className={cn("grid aspect-[3/4] w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-[#F4F4F5]", className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
        <img src={image} alt="" className="size-full object-contain" />
      ) : (
        <Shirt size={16} className="text-[#A1A1AA]" aria-hidden />
      )}
    </span>
  );
}

export function ProductStatusBadge({ isActive }: { isActive: boolean }) {
  const t = useTranslations("AdminPage.products");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium",
        isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#F4F4F5] text-[#52525B]"
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-[#A1A1AA]")} />
      {isActive ? t("active") : t("hidden")}
    </span>
  );
}

/** Dòng cảnh báo tồn kho dưới số lượng; đủ hàng thì không hiện gì để bảng bớt nhiễu */
export function ProductStockHint({ product }: { product: AdminProductItem }) {
  const t = useTranslations("AdminPage.products");

  if (product.totalStock === 0) return <span className="text-xs text-rose-700">{t("outOfStock")}</span>;
  if (product.lowStockVariants > 0) {
    return <span className="text-xs text-amber-700">{t("lowStockSku", { count: product.lowStockVariants })}</span>;
  }
  return null;
}

export function ProductRowMenu({
  product,
  disabled,
  onView,
  onEdit,
  onToggleActive,
  onToggleCustomFit,
}: {
  product: AdminProductItem;
  disabled: boolean;
  onView: (product: AdminProductItem) => void;
  onEdit: (product: AdminProductItem) => void;
  onToggleActive: (product: AdminProductItem) => void;
  onToggleCustomFit: (product: AdminProductItem) => void;
}) {
  const t = useTranslations("AdminPage.products");

  return (
    <AppMenu
      tone="admin"
      width={200}
      align="end"
      sideOffset={4}
      items={[
        { key: "view", label: t("viewDetail"), icon: PackageSearch, onSelect: () => onView(product) },
        { key: "edit", label: t("edit"), icon: Pencil, onSelect: () => onEdit(product) },
        { type: "separator", key: "sep" },
        {
          key: "visibility",
          label: product.isActive ? t("hideProduct") : t("showProduct"),
          icon: product.isActive ? EyeOff : Eye,
          disabled,
          onSelect: () => onToggleActive(product),
        },
        {
          key: "customFit",
          label: product.isCustomFit ? t("disableCustomFit") : t("enableCustomFit"),
          icon: Scissors,
          disabled,
          onSelect: () => onToggleCustomFit(product),
        },
      ]}
      trigger={
        <button
          type="button"
          aria-label={t("rowActions", { name: product.name })}
          className="grid size-8 cursor-pointer place-items-center rounded-md text-[#71717A] outline-none transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/15 data-popup-open:bg-[#F4F4F5]"
        >
          <MoreHorizontal size={16} />
        </button>
      }
    />
  );
}
