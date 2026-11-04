"use client";

import { Eye, EyeOff, MoreHorizontal, Pencil, Scissors, Shirt } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppMenu } from "@/components/shared/AppMenu";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_ROW_ICON_BUTTON_CLASS, AdminStatusText } from "@/features/admin/core/ui";
import { type AdminProductItem } from "../../types/products.types";
import { SALE_MODE_ICONS, groupAllowsCustom, type SaleMode } from "../../utils/saleModes";

/** Ảnh dọc 3:4 — giữ trọn dáng áo, không cắt mất tà */
export function ProductThumb({ product, className }: { product: AdminProductItem; className?: string }) {
  const image = product.images?.[0];

  return (
    <span
      className={cn(
        "grid aspect-[3/4] w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F4F4F5] ring-1 ring-[#E4E4E7]/70",
        className
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
        <img src={image} alt="" className="size-full object-contain" />
      ) : (
        <Shirt size={18} className="text-[#A1A1AA]" aria-hidden />
      )}
    </span>
  );
}

export function ProductStatus({ isActive }: { isActive: boolean }) {
  const t = useTranslations("AdminPage.products");
  return (
    <AdminStatusText tone={isActive ? "success" : "neutral"}>{isActive ? t("active") : t("hidden")}</AdminStatusText>
  );
}

/** Hình thức bán dạng chữ có icon: một món / theo bộ / may đo; hàng may sẵn có nhận may đo thì thêm dấu kéo */
export function ProductSaleMode({ mode, customFit }: { mode: SaleMode; customFit: boolean }) {
  const t = useTranslations("AdminPage.products");
  const Icon = SALE_MODE_ICONS[mode];
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <Icon size={13} aria-hidden />
      {t(`mode.${mode}.label`)}
      {mode !== "CUSTOM" && customFit && (
        <Scissors size={12} className="ml-0.5 text-[#A1A1AA]" aria-label={t("mode.acceptsCustom")} />
      )}
    </span>
  );
}

/** Ô sản phẩm: ảnh + tên (mở màn chi tiết) + mã · số SKU + loại · chất liệu · hình thức bán */
export function ProductIdentity({ product }: { product: AdminProductItem }) {
  const t = useTranslations("AdminPage.products");
  return (
    <Link href={`/admin/products/${product.id}`} className="group flex items-center gap-4 outline-none">
      <ProductThumb product={product} />
      <span className="min-w-0">
        <span className="line-clamp-2 font-medium leading-snug text-[#09090B] group-hover:underline group-focus-visible:underline">
          {product.name}
        </span>
        <span className="mt-1 block font-mono text-xs text-[#A1A1AA]">
          {product.code} · {t("skuCount", { count: product.variantsCount })}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-[#71717A]">
          <span>{product.categoryName}</span>
          {product.materialName && (
            <>
              <span aria-hidden>·</span>
              <span>{product.materialName}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <ProductSaleMode mode={product.saleMode} customFit={product.isCustomFit} />
        </span>
      </span>
    </Link>
  );
}

/** Tồn kho + cảnh báo; may đo không giữ thành phẩm nên hiện "đặt may" */
export function ProductStockCell({ product }: { product: AdminProductItem }) {
  const t = useTranslations("AdminPage.products");
  if (product.saleMode === "CUSTOM") return <span className="text-xs text-[#71717A]">{t("madeToOrder")}</span>;

  const warning =
    product.variantsCount === 0
      ? { text: t("noSku"), className: "text-amber-700" }
      : product.totalStock === 0
        ? { text: t("outOfStock"), className: "text-rose-700" }
        : product.lowStockVariants > 0
          ? { text: t("lowStockSku", { count: product.lowStockVariants }), className: "text-amber-700" }
          : null;

  return (
    <span className="inline-flex flex-col items-end tabular-nums">
      <span className={cn("font-medium text-[#09090B]", warning && product.variantsCount > 0 && warning.className)}>
        {product.totalStock}
      </span>
      {warning && <span className={cn("mt-0.5 whitespace-nowrap text-xs", warning.className)}>{warning.text}</span>}
    </span>
  );
}

interface ProductRowActionsProps {
  product: AdminProductItem;
  disabled: boolean;
  onToggleActive: (product: AdminProductItem) => void;
  onToggleCustomFit: (product: AdminProductItem) => void;
}

/** Menu ⋯ của một dòng: mở chi tiết, ẩn / hiện, bật / tắt nhận may đo */
export function ProductRowActions({ product, disabled, onToggleActive, onToggleCustomFit }: ProductRowActionsProps) {
  const t = useTranslations("AdminPage.products");
  // Nhận may đo chỉ bật / tắt được cho hàng may sẵn thuộc nhóm hàng có may đo
  const canToggleCustomFit = product.saleMode !== "CUSTOM" && groupAllowsCustom(product.categoryGroup);
  const visibilityLabel = product.isActive ? t("hideProduct") : t("showProduct");
  const VisibilityIcon = product.isActive ? EyeOff : Eye;

  return (
    <AppMenu
      tone="admin"
      width={210}
      align="end"
      sideOffset={4}
      items={[
        { key: "edit", label: t("edit"), icon: Pencil, href: `/admin/products/${product.id}` },
        { type: "separator", key: "sep" },
        {
          key: "visibility",
          label: visibilityLabel,
          icon: VisibilityIcon,
          disabled,
          onSelect: () => onToggleActive(product),
        },
        ...(canToggleCustomFit
          ? [
              {
                key: "customFit",
                label: product.isCustomFit ? t("disableCustomFit") : t("enableCustomFit"),
                icon: Scissors,
                disabled,
                onSelect: () => onToggleCustomFit(product),
              },
            ]
          : []),
      ]}
      trigger={
        <button
          type="button"
          aria-label={t("rowActions", { name: product.name })}
          className={ADMIN_ROW_ICON_BUTTON_CLASS}
        >
          <MoreHorizontal size={18} />
        </button>
      }
    />
  );
}
