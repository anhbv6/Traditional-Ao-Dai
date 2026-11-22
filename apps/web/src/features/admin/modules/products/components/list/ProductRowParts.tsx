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

/** Trạng thái hiển thị (Đang bán / Tạm ẩn) — gióng thẳng 2 hàng */
export function ProductStatus({ isActive, inline = false }: { isActive: boolean; inline?: boolean }) {
  const t = useTranslations("AdminPage.products");

  if (inline) {
    return (
      <AdminStatusText tone={isActive ? "success" : "neutral"}>
        {isActive ? t("active") : t("hidden")}
      </AdminStatusText>
    );
  }

  return (
    <div className="min-w-0">
      <p className="truncate">
        <AdminStatusText tone={isActive ? "success" : "neutral"}>
          {isActive ? t("active") : t("hidden")}
        </AdminStatusText>
      </p>
      <p className="mt-0.5 truncate text-xs invisible select-none">—</p>
    </div>
  );
}

/** Cột Sản phẩm: Ảnh + Tên (link chi tiết) + Mã & Biến thể SKU & Cảnh báo sắp hết */
export function ProductIdentity({ product }: { product: AdminProductItem }) {
  const t = useTranslations("AdminPage.products");
  const locale = useLocale();
  const displayName = resolveProductName(product, locale);

  const isCustomMode = product.saleMode === "CUSTOM";
  const isLowStock = !isCustomMode && product.lowStockVariants > 0 && product.totalStock > 0;
  const isOutOfStock = !isCustomMode && product.totalStock === 0 && product.variantsCount > 0;

  return (
    <div className="group/item flex items-center gap-3 min-w-0">
      <Link href={`/admin/products/${product.id}`} className="group/thumb shrink-0">
        <ProductThumb product={product} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/products/${product.id}`}
          className="block truncate text-body font-medium text-[#09090B] transition-colors hover:text-[#18181B] hover:underline"
          title={displayName}
        >
          {displayName}
        </Link>
        <p className="mt-0.5 truncate text-xs text-[#71717A]">
          <span className="font-mono">{product.code}</span>
          <span className="mx-1.5 text-[#D4D4D8]">·</span>
          <span>{t("skuCount", { count: product.variantsCount })}</span>
          {isLowStock && (
            <>
              <span className="mx-1.5 text-[#D4D4D8]">·</span>
              <span className="text-amber-700">{t("lowStockSku", { count: product.lowStockVariants })}</span>
            </>
          )}
          {isOutOfStock && (
            <>
              <span className="mx-1.5 text-[#D4D4D8]">·</span>
              <span className="text-rose-600">{t("outOfStock")}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** Cột Loại sản phẩm: Tên loại + Chất liệu vải (không màu mè) — gióng thẳng 2 hàng */
export function ProductCategoryCell({ product }: { product: AdminProductItem }) {
  const locale = useLocale();
  const categoryName = resolveCategoryName(product, locale);
  const materialName = resolveMaterialName(product, locale);

  return (
    <div className="min-w-0">
      <p className="truncate text-body font-medium text-[#09090B]" title={categoryName || undefined}>
        {categoryName || "—"}
      </p>
      <p className="mt-0.5 truncate text-xs text-[#71717A]" title={materialName || undefined}>
        {materialName || <span className="invisible select-none">—</span>}
      </p>
    </div>
  );
}

/** Cột Hình thức bán: Text thuần túy, không dùng icon rườm rà — gióng thẳng 2 hàng */
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
    <div className="min-w-0">
      <p className="truncate text-body font-medium text-[#27272A]" title={modeLabel}>
        {modeLabel}
      </p>
      <p className="mt-0.5 truncate text-xs text-[#71717A]">
        {canCustomFit ? t("mode.acceptsCustom") : <span className="invisible select-none">—</span>}
      </p>
    </div>
  );
}

/** Cột Tồn kho: Căn đầu (trái) đồng bộ với bảng, chỉ 2 hàng */
export function ProductStockCell({ product, inline = false }: { product: AdminProductItem; inline?: boolean }) {
  const t = useTranslations("AdminPage.products");
  const isOutOfStock = product.totalStock === 0 && product.variantsCount > 0;
  const isNoSku = product.variantsCount === 0;

  if (product.saleMode === "CUSTOM") {
    if (inline) {
      return <span className="font-mono text-xs text-[#71717A]">—</span>;
    }
    return (
      <div className="min-w-0">
        <p className="truncate font-mono text-xs font-medium text-[#71717A]">—</p>
        <p className="mt-0.5 truncate text-xs invisible select-none">—</p>
      </div>
    );
  }

  if (inline) {
    return (
      <span
        className={cn(
          "font-mono font-medium tabular-nums text-[#09090B]",
          isOutOfStock && "text-rose-600"
        )}
      >
        {product.totalStock}
      </span>
    );
  }

  return (
    <div className="min-w-0">
      <p
        className={cn(
          "truncate font-mono text-xs font-semibold tabular-nums text-[#09090B]",
          isOutOfStock && "text-rose-600"
        )}
      >
        {product.totalStock}
      </p>
      <p className="mt-0.5 truncate text-xs text-[#71717A]">
        {isOutOfStock ? (
          <span className="font-medium text-rose-600">{t("outOfStock")}</span>
        ) : isNoSku ? (
          <span className="text-amber-700">{t("noSku")}</span>
        ) : (
          <span className="invisible select-none">—</span>
        )}
      </p>
    </div>
  );
}

interface ProductRowActionsProps {
  product: AdminProductItem;
  disabled: boolean;
  onToggleActive: (product: AdminProductItem) => void;
  onToggleCustomFit: (product: AdminProductItem) => void;
  onPreview?: (product: AdminProductItem) => void;
}

/** Menu ⋯ của một dòng: xem chi tiết, sửa sản phẩm, ẩn / hiện, bật / tắt nhận may đo */
export function ProductRowActions({
  product,
  disabled,
  onToggleActive,
  onToggleCustomFit,
  onPreview,
}: ProductRowActionsProps) {
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
        ...(onPreview
          ? [
              {
                key: "preview",
                label: t("viewDetail"),
                icon: Eye,
                disabled,
                onSelect: () => onPreview(product),
              },
            ]
          : []),
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
