"use client";

import { Eye, EyeOff, MoreHorizontal, Pencil, Scissors, Shirt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AppMenu } from "@/components/shared/AppMenu";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_ROW_ICON_BUTTON_CLASS, AdminStatusText } from "@/features/admin/core/ui";
import { type AdminProductItem } from "../../types/products.types";
import { groupAllowsCustom } from "../../utils/saleModes";

/**
 * Lấy tên theo ngôn ngữ trang web:
 * - Tiếng Việt ('vi'): lấy tiếng Việt, thiếu thì lùi về tiếng Anh.
 * - Tiếng Anh ('en') hoặc khác: lấy tiếng Anh, thiếu thì lùi về tiếng Việt.
 */
export function resolveProductName(product: AdminProductItem, locale: string): string {
  if (locale === "vi") {
    return product.name || product.nameEn || "";
  }
  return product.nameEn || product.name || "";
}

export function resolveCategoryName(product: AdminProductItem, locale: string): string {
  if (locale === "vi") {
    return product.categoryName || product.categoryNameEn || "";
  }
  return product.categoryNameEn || product.categoryName || "";
}

export function resolveMaterialName(product: AdminProductItem, locale: string): string {
  if (locale === "vi") {
    return product.materialName || product.materialNameEn || "";
  }
  return product.materialNameEn || product.materialName || "";
}

/** Ảnh đại diện 3:4 — chuẩn dáng áo dài, viền nhẹ nhàng tinh tế */
export function ProductThumb({ product, className }: { product: AdminProductItem; className?: string }) {
  const image = product.images?.[0];

  return (
    <span
      className={cn(
        "relative grid aspect-[3/4] w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F4F4F5] border border-[#E4E4E7]/80 shadow-2xs transition-transform group-hover/thumb:scale-105",
        className
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        <Shirt size={16} className="text-[#A1A1AA]" aria-hidden />
      )}
    </span>
  );
}

/** Trạng thái hiển thị (Đang bán / Tạm ẩn) */
export function ProductStatus({ isActive }: { isActive: boolean }) {
  const t = useTranslations("AdminPage.products");
  return (
    <AdminStatusText tone={isActive ? "success" : "neutral"}>
      {isActive ? t("active") : t("hidden")}
    </AdminStatusText>
  );
}

/** Cột Sản phẩm: Ảnh + Tên (link chi tiết) + Mã & Biến thể SKU */
export function ProductIdentity({ product }: { product: AdminProductItem }) {
  const t = useTranslations("AdminPage.products");
  const locale = useLocale();
  const displayName = resolveProductName(product, locale);

  return (
    <div className="group/item flex items-center gap-3">
      <Link href={`/admin/products/${product.id}`} className="group/thumb shrink-0">
        <ProductThumb product={product} />
      </Link>
      <div className="min-w-0">
        <Link
          href={`/admin/products/${product.id}`}
          className="block truncate text-body font-medium text-[#09090B] transition-colors hover:text-[#18181B] hover:underline"
        >
          {displayName}
        </Link>
        <p className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-[#71717A]">
          <span>{product.code}</span>
          <span className="text-[#D4D4D8]">·</span>
          <span className="font-sans">{t("skuCount", { count: product.variantsCount })}</span>
        </p>
      </div>
    </div>
  );
}

/** Cột Loại sản phẩm: Tên loại + Chất liệu vải (không màu mè) */
export function ProductCategoryCell({ product }: { product: AdminProductItem }) {
  const locale = useLocale();
  const categoryName = resolveCategoryName(product, locale);
  const materialName = resolveMaterialName(product, locale);

  return (
    <div className="min-w-0">
      <p className="truncate text-body font-medium text-[#09090B]">{categoryName || "—"}</p>
      {materialName && <p className="mt-0.5 truncate text-2xs text-[#71717A]">{materialName}</p>}
    </div>
  );
}

/** Cột Hình thức bán: Text thuần túy, không dùng icon rườm rà */
export function ProductSaleModeCell({ product, inline = false }: { product: AdminProductItem; inline?: boolean }) {
  const t = useTranslations("AdminPage.products");
  const modeLabel = t(`mode.${product.saleMode}.label`);
  const canCustomFit = product.saleMode !== "CUSTOM" && product.isCustomFit;

  if (inline) {
    return (
      <span className="text-xs text-[#71717A]">
        {modeLabel}
        {canCustomFit && ` · ${t("mode.acceptsCustom")}`}
      </span>
    );
  }

  return (
    <div>
      <p className="text-body font-medium text-[#27272A]">{modeLabel}</p>
      {canCustomFit && <p className="mt-0.5 text-2xs text-[#71717A]">{t("mode.acceptsCustom")}</p>}
    </div>
  );
}

/** Cột Tồn kho + cảnh báo sắp hết/hết hàng; hàng may đo hiện "Đặt may" */
export function ProductStockCell({ product }: { product: AdminProductItem }) {
  const t = useTranslations("AdminPage.products");
  if (product.saleMode === "CUSTOM") {
    return <span className="text-xs text-[#71717A]">{t("madeToOrder")}</span>;
  }

  const isOutOfStock = product.totalStock === 0 && product.variantsCount > 0;
  const isNoSku = product.variantsCount === 0;
  const isLowStock = product.lowStockVariants > 0 && !isOutOfStock;

  return (
    <div className="text-right">
      <span
        className={cn(
          "font-mono text-xs font-semibold tabular-nums text-[#09090B]",
          isOutOfStock && "text-rose-600"
        )}
      >
        {product.totalStock}
      </span>
      {isOutOfStock && <p className="mt-0.5 text-2xs font-medium text-rose-600">{t("outOfStock")}</p>}
      {isLowStock && (
        <p className="mt-0.5 text-2xs text-amber-700">{t("lowStockSku", { count: product.lowStockVariants })}</p>
      )}
      {isNoSku && <p className="mt-0.5 text-2xs text-amber-700">{t("noSku")}</p>}
    </div>
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
