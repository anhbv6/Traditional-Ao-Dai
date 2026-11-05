"use client";

import { useState } from "react";
import { Shirt } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminField,
  AdminFilterSelect,
  AdminTextField,
  AdminTooltip,
} from "@/features/admin/core/ui";
import { PRODUCT_GROUP_COLORS, PRODUCT_GROUP_ICONS } from "@/features/admin/modules/categories";
import { createProductAction } from "../../actions/products.actions";
import { type AdminProductCategory } from "../../types/products.types";
import { SALE_MODES, SALE_MODE_ICONS, allowedSaleModes, type SaleMode } from "../../utils/saleModes";

/**
 * Tạo nhanh sản phẩm: tên → loại sản phẩm → hình thức bán (chỉ những hình thức nhóm hàng của loại cho phép),
 * xong chuyển sang màn chi tiết để nhập giá, ảnh, SKU
 */
export function CreateProductDialog({
  categories,
  onOpenChange,
}: {
  categories: AdminProductCategory[];
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("AdminPage.products");
  const tSizing = useTranslations("AdminPage.sizing");
  const notify = useNotify();
  const router = useRouter();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [mode, setMode] = useState<SaleMode>("SINGLE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const category = categories.find((c) => c.id === categoryId) ?? null;
  const allowed = category ? allowedSaleModes(category.group) : (["SINGLE"] as SaleMode[]);
  // Đổi loại mà hình thức đang chọn không còn hợp lệ thì về "một món"
  const saleMode: SaleMode = allowed.includes(mode) ? mode : "SINGLE";
  const GroupIcon = category ? PRODUCT_GROUP_ICONS[category.group] : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!category) return;
    setIsSubmitting(true);
    try {
      const res = await createProductAction({ name, categoryId: category.id, saleMode });
      if (!res.success) {
        notify.error(res.error, "PRODUCT_CREATE_FAILED");
        return;
      }
      notify.success(t("create.success"));
      router.push(`/admin/products/${res.data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={Shirt}
      title={t("create.title")}
      description={t("create.description")}
      size="lg"
      onSubmit={handleSubmit}
      bodyClassName="space-y-4"
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !category}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {isSubmitting ? t("saving") : t("create.submit")}
          </button>
        </>
      }
    >
      <AdminTextField
        autoFocus
        required
        label={t("field.name")}
        value={name}
        onValueChange={setName}
        placeholder={t("placeholders.vi.name")}
      />

      <AdminField required label={t("field.category")}>
        <AdminFilterSelect
          label={t("field.categoryShort")}
          value={categoryId}
          options={categories.map((c) => ({ value: c.id, label: c.label }))}
          onChange={setCategoryId}
          className="h-10 w-full"
        />
        {category && GroupIcon && (
          <p className="flex items-center gap-1.5 text-xs text-[#71717A]">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium",
                PRODUCT_GROUP_COLORS[category.group].chip
              )}
            >
              <GroupIcon size={12} aria-hidden /> {tSizing(`group.${category.group}`)}
            </span>
            {t("create.inheritHint")}
          </p>
        )}
      </AdminField>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-[#3F3F46]">{t("field.saleMode")}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {SALE_MODES.map((value) => {
            const Icon = SALE_MODE_ICONS[value];
            const enabled = allowed.includes(value);
            const selected = saleMode === value;
            return (
              <AdminTooltip key={value} content={enabled ? null : t("mode.notAllowed")}>
                <span className="grid" tabIndex={enabled ? undefined : 0}>
                  <button
                    type="button"
                    disabled={!enabled}
                    aria-pressed={selected}
                    onClick={() => setMode(value)}
                    className={cn(
                      "flex w-full cursor-pointer flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      selected
                        ? "border-[#18181B] bg-[#18181B] text-white"
                        : "border-[#E4E4E7] text-[#3F3F46] hover:border-[#A1A1AA]"
                    )}
                  >
                    <Icon size={16} aria-hidden />
                    <span className="text-sm font-semibold">{t(`mode.${value}.label`)}</span>
                    <span className={cn("text-2xs leading-4", selected ? "text-white/70" : "text-[#71717A]")}>
                      {t(`mode.${value}.short`)}
                    </span>
                  </button>
                </span>
              </AdminTooltip>
            );
          })}
        </div>
      </fieldset>
    </AdminDialog>
  );
}
