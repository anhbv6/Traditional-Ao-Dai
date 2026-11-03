"use client";

import { useState, type ReactNode } from "react";
import { Loader2, Shirt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useProductDetail } from "../hooks/useProductDetail";
import { Link } from "@/i18n/routing";
import { type AdminProductDetail } from "../types/products.types";
import { ProductStatusBadge, ProductStockHint } from "./ProductRowParts";

interface ProductDetailDialogProps {
  productId: string | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (productId: string) => void;
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-sm text-[#71717A]">{label}</dt>
      <dd className="min-w-0 text-right text-sm text-[#09090B]">{children}</dd>
    </div>
  );
}

/** Ảnh lớn dọc 3:4 kèm dải ảnh nhỏ */
function ProductGallery({ product }: { product: AdminProductDetail }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = product.images[activeIndex];

  return (
    <div>
      <div className="grid aspect-[3/4] place-items-center overflow-hidden rounded-lg bg-[#F4F4F5]">
        {activeImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
          <img src={activeImage} alt={product.name} className="size-full object-contain" />
        ) : (
          <Shirt size={28} className="text-[#A1A1AA]" aria-hidden />
        )}
      </div>

      {product.images.length > 1 && (
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {product.images.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={`${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "aspect-[3/4] cursor-pointer overflow-hidden rounded-md border-2",
                index === activeIndex ? "border-[#18181B]" : "border-transparent"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image */}
              <img src={url} alt="" className="size-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductDetailBody({ product }: { product: AdminProductDetail }) {
  const t = useTranslations("AdminPage.products");
  const locale = useLocale() as Locale;
  const basePrice = Number(product.basePrice);

  return (
    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
      <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
        <ProductGallery product={product} />

        <div className="min-w-0">
          <ProductStatusBadge isActive={product.isActive} />
          <p className="mt-2 text-xl font-semibold tabular-nums text-[#09090B]">{formatVnd(basePrice, locale)}</p>

          <dl className="mt-3 divide-y divide-[#F4F4F5] border-t border-[#F4F4F5]">
            <InfoRow label={t("colCategory")}>{product.categoryName ?? t("uncategorized")}</InfoRow>
            <InfoRow label={t("colMaterial")}>{product.material || "—"}</InfoRow>
            <InfoRow label={t("field.sizeChart")}>
              {product.effectiveSizeChart ? (
                <Link href={`/admin/catalog/size-charts/${product.effectiveSizeChart.id}`} className="hover:underline">
                  {product.effectiveSizeChart.name}
                  {product.effectiveSizeChart.inherited && (
                    <span className="ml-1 text-xs text-[#71717A]">({t("detail.sizeChartInherited")})</span>
                  )}
                </Link>
              ) : (
                "—"
              )}
            </InfoRow>
            <InfoRow label={t("colStock")}>
              <span className="tabular-nums">{product.totalStock}</span>
              <span className="block">
                <ProductStockHint product={product} />
              </span>
            </InfoRow>
            <InfoRow label={t("colSold")}>
              <span className="tabular-nums">{product.soldCount}</span>
            </InfoRow>
            <InfoRow label={t("colCustomFit")}>{product.isCustomFit ? t("yes") : t("no")}</InfoRow>
            <InfoRow label={t("field.isFeatured")}>{product.isFeatured ? t("yes") : t("no")}</InfoRow>
            <InfoRow label={t("detail.slug")}>
              <span className="break-all">{product.slug}</span>
            </InfoRow>
          </dl>
        </div>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-[#09090B]">{t("field.description")}</h3>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[#3F3F46]">
          {product.description || t("detail.noDescription")}
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-[#09090B]">{t("sectionVariants")}</h3>
        {product.variants.length === 0 ? (
          <p className="mt-1.5 text-sm text-[#71717A]">{t("detail.noVariants")}</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-lg border border-[#E4E4E7]">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b border-[#E4E4E7] bg-[#FAFAFA] text-xs text-[#71717A]">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{t("variant.sku")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("variant.size")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("variant.color")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("colPrice")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("colStock")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5]">
                {product.variants.map((v) => (
                  <tr key={v.id}>
                    <td className="px-3 py-2 text-[#3F3F46]">{v.sku}</td>
                    <td className="px-3 py-2 text-[#09090B]">{v.size}</td>
                    <td className="px-3 py-2 text-[#3F3F46]">{v.color || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[#09090B]">
                      {formatVnd(v.price ?? basePrice, locale)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-[#09090B]">{v.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/** Dialog xem chi tiết sản phẩm, từ đây có thể chuyển sang sửa */
export function ProductDetailDialog({ productId, onOpenChange, onEdit }: ProductDetailDialogProps) {
  const t = useTranslations("AdminPage.products");
  const detail = useProductDetail(productId);
  const product = detail.data;

  return (
    <Dialog open={Boolean(productId)} onOpenChange={onOpenChange}>
      <DialogContent className="admin-shell flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-xl border border-[#E4E4E7] bg-white p-0 sm:max-w-3xl">
        <div className="border-b border-[#E4E4E7] px-4 py-4 pr-12 sm:px-6">
          <DialogTitle className="text-base font-semibold text-[#09090B]">{product?.name ?? t("detail.title")}</DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-[#71717A]">
            {product ? t("skuCount", { count: product.variantsCount }) : t("loading")}
          </DialogDescription>
        </div>

        {product ? (
          <ProductDetailBody key={product.id} product={product} />
        ) : detail.isError ? (
          <p className="px-6 py-16 text-center text-sm text-rose-700">{t("loadFailed")}</p>
        ) : (
          <div className="grid place-items-center py-20 text-[#71717A]">
            <Loader2 size={20} className="animate-spin" aria-label={t("loading")} />
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[#E4E4E7] px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 cursor-pointer rounded-lg px-3.5 text-sm font-medium text-[#52525B] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
          >
            {t("close")}
          </button>
          <button
            type="button"
            disabled={!product}
            onClick={() => product && onEdit(product.id)}
            className="h-9 cursor-pointer rounded-lg bg-[#18181B] px-4 text-sm font-medium text-white shadow-2xs transition-colors hover:bg-[#09090B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("edit")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
