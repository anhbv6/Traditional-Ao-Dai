"use client";

import { Scissors } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  AdminDialog,
} from "@/features/admin/core/ui";
import {
  type AdminProductAttributeOption,
  type AdminProductDesignGroup,
  type AdminProductMaterialOption,
} from "../../types/products.types";
import { ProductMaterialField } from "./ProductMaterialField";

interface ProductMaterialDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string | null;
  onMaterialChange: (materialId: string | null) => void;
  materials: AdminProductMaterialOption[];
  attributeIds: string[];
  onToggleAttribute: (id: string) => void;
  designGroups: AdminProductDesignGroup[];
  attributes: AdminProductAttributeOption[];
}

/**
 * Hộp thoại cấu hình Chất liệu vải chính & Đặc tính thiết kế (mở từ nút Tùy chọn).
 * Gom trọn vẹn hồ sơ vải (thanh đo, xuất xứ, bảo quản) và các chi tiết may đo (cổ, tay, tà, lót)
 * để màn hình chi tiết sản phẩm chính luôn gọn gàng, không bị lặp lại.
 */
export function ProductMaterialDesignDialog({
  open,
  onOpenChange,
  materialId,
  onMaterialChange,
  materials,
  attributeIds,
  onToggleAttribute,
  designGroups,
  attributes,
}: ProductMaterialDesignDialogProps) {
  const t = useTranslations("AdminPage.products");
  const locale = useLocale();

  return (
    <AdminDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Scissors}
      title={t("materialDialog.title")}
      description={t("materialDialog.description")}
      size="lg"
      footer={
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
        >
          {t("materialDialog.done")}
        </button>
      }
      bodyClassName="space-y-5"
    >
      {/* 1. Chất liệu vải chính */}
      <div>
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
          {t("materialDialog.materialSection")}
        </h3>
        <ProductMaterialField
          value={materialId}
          onChange={onMaterialChange}
          materials={materials}
        />
      </div>

      {/* 2. Đặc tính thiết kế may đo */}
      {designGroups.length > 0 && (
        <div className="border-t border-dashed border-[#E4E4E7] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">
              {t("materialDialog.designSection")}
            </h3>
            <span className="text-2xs text-[#71717A]">
              {t("materialDialog.selectedTraits", { count: attributeIds.length })}
            </span>
          </div>

          <div className="space-y-4">
            {designGroups.map((designGroup) => {
              const choices = attributes.filter(
                (a) => a.group === designGroup.code && (a.isActive || attributeIds.includes(a.id))
              );
              if (choices.length === 0) return null;
              return (
                <div key={designGroup.code} className="grid gap-1.5 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-3">
                  <span className="pt-1 text-xs font-medium text-[#3F3F46]">
                    {locale === "en" && designGroup.nameEn ? designGroup.nameEn : designGroup.name}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {choices.map((choice) => {
                      const on = attributeIds.includes(choice.id);
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => onToggleAttribute(choice.id)}
                          className={cn(
                            "h-7 cursor-pointer rounded-full border px-3 text-xs font-medium transition-colors",
                            on
                              ? "border-[#18181B] bg-[#18181B] text-white"
                              : "border-[#E4E4E7] bg-white text-[#3F3F46] hover:border-[#A1A1AA]"
                          )}
                        >
                          {choice.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-2xs text-[#71717A]">
            {t("design.manage")}{" "}
            <Link
              href="/admin/catalog/attributes"
              target="_blank"
              className="font-medium text-[#09090B] hover:underline"
            >
              {t("design.manageLink")}
            </Link>
          </p>
        </div>
      )}
    </AdminDialog>
  );
}
