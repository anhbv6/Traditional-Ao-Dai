"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import { useTranslations } from "next-intl";
import { PRODUCT_GROUPS, type ProductGroup } from "@repo/shared/sizing";
import { useNotify } from "@/hooks/useNotify";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminInfoTip,
} from "@/features/admin/core/ui";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { PRODUCT_GROUP_ICONS, groupUsesSizeChart } from "@/features/admin/modules/categories";
import { createSizeChartAction } from "../../actions/sizeCharts.actions";

// Phụ kiện, vải bán theo mét không có size nên không tạo bảng size
const SIZED_GROUPS = PRODUCT_GROUPS.filter(groupUsesSizeChart);

/** Tạo nhanh bảng size (tên + nhóm hàng) rồi chuyển sang trình soạn để nhập số liệu */
export function CreateSizeChartDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("AdminPage.sizeCharts");
  const tSizing = useTranslations("AdminPage.sizing");
  const notify = useNotify();
  const router = useRouter();
  const [name, setName] = useState("");
  const [group, setGroup] = useState<ProductGroup>("AO_DAI");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createSizeChartAction({ name, group });
      if (!res.success) {
        notify.error(res.error, "SIZE_CHART_CREATE_FAILED");
        return;
      }
      notify.success(t("create.success"));
      router.push(`/admin/catalog/size-charts/${res.data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={Ruler}
      title={t("create.title")}
      description={t("create.description")}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button type="submit" disabled={isSubmitting || !name.trim()} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {isSubmitting ? t("processing") : t("create.submit")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#3F3F46]">{t("field.name")} *</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("create.namePlaceholder")}
            className="h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B]"
          />
        </label>
        <fieldset className="space-y-1.5">
          <legend className="flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
            {t("field.group")}
            <AdminInfoTip content={t("create.groupHint")} />
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {SIZED_GROUPS.map((value) => {
              const Icon = PRODUCT_GROUP_ICONS[value];
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={group === value}
                  onClick={() => setGroup(value)}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-1.5 rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-colors",
                    group === value
                      ? "border-[#18181B] bg-[#18181B] text-white"
                      : "border-[#E4E4E7] text-[#3F3F46] hover:border-[#A1A1AA]"
                  )}
                >
                  <Icon size={16} aria-hidden /> {tSizing(`group.${value}`)}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </AdminDialog>
  );
}
