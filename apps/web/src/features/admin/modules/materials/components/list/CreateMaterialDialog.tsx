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
  AdminTextField,
} from "@/features/admin/core/ui";
import { toSlug } from "@/features/admin/modules/products";
import { createMaterialAction } from "../../actions/materials.actions";

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
        <AdminTextField
          autoFocus
          required
          label={t("field.name")}
          value={name}
          onValueChange={setName}
          placeholder={t("placeholders.vi.name")}
        />
        <AdminTextField
          required
          label={t("field.code")}
          hint={t("hints.code")}
          value={effectiveCode}
          onValueChange={(value) => {
            setCodeTouched(true);
            setCode(value.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
          }}
          placeholder={t("placeholders.code")}
          inputClassName="font-mono"
        />
      </div>
    </AdminDialog>
  );
}
