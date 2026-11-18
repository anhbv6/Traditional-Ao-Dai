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
import { createProductAction } from "../../actions/products.actions";
import { type AdminProductCategory } from "../../types/products.types";
import { SALE_MODES, SALE_MODE_ICONS, allowedSaleModes, type SaleMode } from "../../utils/saleModes";

/**
 * Tạo nhanh sản phẩm: tên → nhóm hàng (cha) → loại sản phẩm (con) → hình thức bán,
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

  const roots = categories.filter((c) => c.parentId === null);
  const [rootId, setRootId] = useState(roots[0]?.id ?? "");

  // Các loại con thuộc nhóm cha đang chọn
  const childrenOfRoot = categories.filter((c) => c.parentId === rootId);
  const [categoryId, setCategoryId] = useState(childrenOfRoot[0]?.id ?? rootId);
  const [mode, setMode] = useState<SaleMode>("SINGLE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Khi đổi nhóm cha: tự động chọn loại con đầu tiên của nhóm đó
  const handleRootChange = (nextRootId: string) => {
    setRootId(nextRootId);
    const nextChildren = categories.filter((c) => c.parentId === nextRootId);
    const nextCategory = nextChildren[0]?.id ?? nextRootId;
    setCategoryId(nextCategory);
  };

  const category = categories.find((c) => c.id === categoryId) ?? categories[0] ?? null;
  const allowed = category ? allowedSaleModes(category.group) : (["SINGLE"] as SaleMode[]);
  // Đổi loại mà hình thức đang chọn không còn hợp lệ thì về "một món"
  const saleMode: SaleMode = allowed.includes(mode) ? mode : "SINGLE";

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

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField required label={t("field.categoryParent")}>
          <AdminFilterSelect
            label={t("field.categoryParentShort")}
            value={rootId}
            options={roots.map((r) => ({ value: r.id, label: r.name }))}
            onChange={handleRootChange}
            className="h-10 w-full"
          />
        </AdminField>

        <AdminField required label={t("field.category")}>
          <AdminFilterSelect
            label={t("field.categoryShort")}
            value={categoryId}
            options={(childrenOfRoot.length > 0 ? childrenOfRoot : [roots.find((r) => r.id === rootId) || category]).filter(Boolean).map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            onChange={setCategoryId}
            className="h-10 w-full"
          />
        </AdminField>
      </div>

      {category && (
        <p className="text-xs text-[#71717A]">
          {tSizing(`group.${category.group}`)} · {t("create.inheritHint")}
        </p>
      )}

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
