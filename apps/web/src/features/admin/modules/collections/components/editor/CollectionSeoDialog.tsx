"use client";

import { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  AdminDialog,
  AdminLangSwitch,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { type SaveCollectionValues } from "../../schemas/collections.schemas";
import { CollectionSeoField } from "./CollectionSeoField";

/**
 * Dialog SEO mở từ "Tùy chọn nâng cao": sửa thẳng vào form của màn bộ sưu tập (không lưu riêng) —
 * bấm "Xong" chỉ đóng dialog, thay đổi được ghi khi bấm "Lưu thay đổi" ở thanh đầu màn.
 */
export function CollectionSeoDialog({
  open,
  onOpenChange,
  form,
  slugLocked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<SaveCollectionValues>;
  slugLocked: boolean;
}) {
  const t = useTranslations("AdminPage.collections");
  const notify = useNotify();
  const locale = useLocale();
  const [lang, setLang] = useState<AdminContentLang>(locale === "en" ? "en" : "vi");
  const slugError = form.formState.errors.slug?.message;

  return (
    <AdminDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Search}
      title={t("editor.sections.seo")}
      description={t("editor.sections.seoHint")}
      size="lg"
      headerAside={
        <AdminLangSwitch value={lang} onChange={setLang} label={t("editor.langTabs.label")} className="mt-1" />
      }
      footer={
        <>
          <p className="mr-auto text-xs text-[#71717A]">{t("seoDialog.saveNote")}</p>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {t("seoDialog.done")}
          </button>
        </>
      }
    >
      <CollectionSeoField form={form} slugLocked={slugLocked} lang={lang} />
      {slugError && <p className="mt-2 text-xs text-rose-700">{notify.translateError(slugError)}</p>}
    </AdminDialog>
  );
}
