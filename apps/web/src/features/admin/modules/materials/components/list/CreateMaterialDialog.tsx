"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminInfoTip,
} from "@/features/admin/core/ui";
import { toSlug } from "@/features/admin/modules/products";
import { createMaterialAction } from "../../actions/materials.actions";

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B]";

/** Tạo nhanh chất liệu (tên + mã) rồi chuyển sang màn chi tiết để nhập thông số */
export function CreateMaterialDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("AdminPage.materials");
  const notify = useNotify();
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Mã gợi ý từ tên: "Lụa tơ tằm" → "LUA-TO-TAM"
  const effectiveCode = codeTouched ? code : toSlug(name).toUpperCase();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createMaterialAction({ name, code: effectiveCode });
      if (!res.success) {
        notify.error(res.error, "MATERIAL_CREATE_FAILED");
        return;
      }
      notify.success(t("create.success"));
      router.push(`/admin/catalog/materials/${res.data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={Layers}
      title={t("create.title")}
      description={t("create.description")}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !effectiveCode}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
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
            placeholder={t("placeholders.vi.name")}
            className={INPUT_CLASS}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
            {t("field.code")} *
            <AdminInfoTip content={t("hints.code")} />
          </span>
          <input
            value={effectiveCode}
            onChange={(e) => {
              setCodeTouched(true);
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
            }}
            placeholder={t("placeholders.code")}
            className={`${INPUT_CLASS} font-mono`}
          />
        </label>
      </div>
    </AdminDialog>
  );
}
