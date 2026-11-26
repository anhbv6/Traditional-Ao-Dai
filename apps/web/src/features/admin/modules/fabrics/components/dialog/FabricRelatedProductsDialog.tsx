"use client";

import { Shirt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import {
  AdminDialog,
  AdminStatusText,
  AdminSwitch,
} from "@/features/admin/core/ui";
import { type FabricProductOption } from "../../types/fabrics.types";

interface FabricRelatedProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: FabricProductOption[];
  colorId: string | null;
  isPending: boolean;
  onToggleProduct: (productId: string) => void;
}

/**
 * Dialog hiển thị danh sách các mẫu áo sử dụng chất liệu của cây vải:
 * - Giao diện thẻ chia dòng viền dashed, có số thứ tự, ảnh đại diện, tên, giá, mã và trạng thái
 * - Cho phép bật/tắt hiển thị sản phẩm trên web trực tiếp
 */
export function FabricRelatedProductsDialog({
  open,
  onOpenChange,
  products,
  colorId,
  isPending,
  onToggleProduct,
}: FabricRelatedProductsDialogProps) {
  const t = useTranslations("AdminPage.fabrics");
  const locale = useLocale() as Locale;

  return (
    <AdminDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("rollDialog.relatedProductsTitle")}
      description={t("rollDialog.relatedCount", { count: products.length })}
      size="lg"
    >
      {products.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#71717A]">
          {t("detail.relatedProductsEmpty")}
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto pr-1 [scrollbar-width:thin]">
          <ol>
            {products.map((p, index) => {
              const matchesColor = Boolean(colorId && p.colorIds?.includes(colorId));

              return (
                <li key={p.id} className="flex items-center gap-3 p-3 px-0 sm:p-3.5 sm:px-0">
                  {/* Số thứ tự */}
                  <span className="w-5 shrink-0 text-center text-xs tabular-nums text-[#A1A1AA]">
                    {index + 1}
                  </span>

                  {/* Thumbnail ảnh sản phẩm */}
                  <span className="grid h-16 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F4F4F5] border border-black/5">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm URL tùy ý do admin nhập
                      <img src={p.image} alt="" className="size-full object-cover" />
                    ) : (
                      <Shirt size={18} className="text-[#A1A1AA]" aria-hidden />
                    )}
                  </span>

                  {/* Thông tin chi tiết */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="line-clamp-1 text-sm font-medium leading-snug text-[#09090B]">
                        {p.name}
                      </p>
                      {matchesColor && (
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-medium text-amber-800">
                          {t("rollDialog.colorMatch")}
                        </span>
                      )}
                    </div>

                    {p.basePrice !== undefined && (
                      <p className="mt-0.5 font-mono text-xs tabular-nums text-[#52525B]">
                        {formatVnd(p.basePrice, locale)}
                      </p>
                    )}

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                      <AdminStatusText tone={p.isVisible ? "success" : "neutral"}>
                        {p.isVisible ? t("product.visible") : t("product.hidden")}
                      </AdminStatusText>
                      <span className="font-mono text-2xs text-[#A1A1AA]">{p.code}</span>
                    </div>
                  </div>

                  {/* Switch hiển thị */}
                  <div className="shrink-0 pl-2">
                    <AdminSwitch
                      checked={p.isVisible}
                      onChange={() => onToggleProduct(p.id)}
                      disabled={isPending}
                      label={p.name}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </AdminDialog>
  );
}
