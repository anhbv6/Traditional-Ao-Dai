"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { type Locale } from "@repo/shared";
import { AdminButton, AdminDialog, AdminDialogFooter, AdminSecondaryButton } from "@/features/admin/core/ui";
import { ProductPreviewView, type DisplayProduct } from "@/features/products";
import { type AdminProductItem } from "../../types/products.types";
import { getProductPreviewAction } from "../../actions/products.actions";
import { resolveProductName } from "../list/ProductRowParts";

interface ProductDetailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AdminProductItem | null;
}

/**
 * Hộp thoại xem trước chi tiết sản phẩm trong trang quản trị:
 * - Mở nhanh khi bấm "Xem chi tiết" ở menu thao tác từng dòng sản phẩm.
 * - Tái sử dụng component ProductPreviewView giống hệt giao diện khách hàng nhìn thấy.
 * - Luôn tải và hiển thị 100% dữ liệu thực từ database (ảnh, màu sắc, size, giá bán, tồn kho).
 * - Thiết kế căn giữa màn hình, góc bo tròn mềm mại (rounded-2xl), kích thước vừa vặn không quá rộng/dài.
 */
export function ProductDetailPreviewDialog({ open, onOpenChange, product }: ProductDetailPreviewDialogProps) {
  const t = useTranslations("AdminPage.products");
  const locale = useLocale() as Locale;
  const [fullProduct, setFullProduct] = useState<DisplayProduct | null>(null);
  const [prevProductId, setPrevProductId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const currentProductId = open && product ? product.id : null;
  if (currentProductId !== prevProductId) {
    setPrevProductId(currentProductId);
    setFullProduct(null);
  }

  useEffect(() => {
    if (!open || !product) return;

    // Tải thông tin chi tiết đầy đủ chuẩn xác từ DB qua Server Action
    startTransition(async () => {
      const res = await getProductPreviewAction(product.id, locale);
      if (res.success && res.data) {
        setFullProduct(res.data);
      }
    });
  }, [open, product, locale]);

  if (!product) return null;

  const displayName = resolveProductName(product, locale) || product.name;

  return (
    <AdminDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("previewTitle")}
      description={`${displayName} · ${product.code}`}
      className="max-w-[calc(100vw-2rem)] sm:max-w-[880px] rounded-2xl bg-[#FAF7F5] border border-[#E8DFD8]"
      bodyClassName="p-5 sm:p-7 max-h-[82vh] overflow-y-auto scrollbar-brand bg-[#FAF7F5]"
      footer={
        <AdminDialogFooter className="w-full justify-between border-t border-[#E8DFD8]">
          <span className="text-xs text-[#71717A]">
            {t("previewDesc")}
          </span>
          <div className="flex items-center gap-2">
            <AdminSecondaryButton onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </AdminSecondaryButton>
            <AdminButton
              variant="primary"
              size="sm"
              href={`/admin/products/${product.id}`}
            >
              {t("edit")}
            </AdminButton>
          </div>
        </AdminDialogFooter>
      }
    >
      {fullProduct ? (
        <ProductPreviewView
          key={fullProduct.id}
          product={fullProduct}
          galleryImages={fullProduct.galleryImages}
          locale={locale}
          compact={true}
        />
      ) : (
        /* Skeleton loading phản ánh chính xác bố cục trước khi dữ liệu thật xuất hiện */
        <div className="grid grid-cols-1 items-start gap-6 sm:gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)] lg:gap-8 animate-pulse">
          <div className="space-y-3">
            <div className="aspect-[1.05/1] w-full rounded-lg bg-[#EDE5DE]" />
            <div className="grid grid-cols-4 gap-2">
              <div className="aspect-square rounded bg-[#EDE5DE]" />
              <div className="aspect-square rounded bg-[#EDE5DE]" />
              <div className="aspect-square rounded bg-[#EDE5DE]" />
              <div className="aspect-square rounded bg-[#EDE5DE]" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 w-3/4 rounded bg-[#EDE5DE]" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-[#EDE5DE]" />
              <div className="h-4 w-5/6 rounded bg-[#EDE5DE]" />
            </div>
            <div className="h-7 w-1/3 rounded bg-[#EDE5DE]" />
            <div className="h-8 w-1/2 rounded bg-[#EDE5DE]" />
            <div className="h-8 w-2/3 rounded bg-[#EDE5DE]" />
          </div>
        </div>
      )}
    </AdminDialog>
  );
}
