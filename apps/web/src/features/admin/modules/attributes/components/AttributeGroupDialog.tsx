"use client";

import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminLangSwitch,
  AdminTextArea,
  AdminTextField,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { toSlug } from "@/features/admin/modules/products";
import { createAttributeGroupAction, updateAttributeGroupAction } from "../actions/attributes.actions";
import { type AttributeGroupFormValues } from "../schemas/attributes.schemas";
import { type AdminAttributeData, type AdminAttributeGroup } from "../types/attributes.types";

const LANG_FIELDS = {
  vi: { name: "name", description: "description" },
  en: { name: "nameEn", description: "descriptionEn" },
} as const satisfies Record<AdminContentLang, Record<string, keyof AttributeGroupFormValues>>;

/**
 * Dialog thêm / sửa nhóm thuộc tính (thuộc tính cha). Nhóm mới luôn là đặc tính thiết kế (chọn nhiều cho sản phẩm,
 * dùng để lọc và mô tả). Nhóm hệ thống chỉ đổi tên / mô tả, mã cố định vì màu, size và form sản phẩm dựa vào mã.
 */
export function AttributeGroupDialog({
  group,
  onOpenChange,
  onSaved,
}: {
  /** null = thêm mới */
  group: AdminAttributeGroup | null;
  onOpenChange: (open: boolean) => void;
  /** Lưu xong — trả dữ liệu mới và id nhóm (để chọn nhóm vừa tạo) */
  onSaved: (data: AdminAttributeData, groupId: string) => void;
}) {
  const t = useTranslations("AdminPage.attributes");
  const locale = useLocale();
  const notify = useNotify();
  const [values, setValues] = useState<AttributeGroupFormValues>(() => ({
    code: group?.code ?? "",
    name: group?.name ?? "",
    nameEn: group?.nameEn ?? "",
    description: group?.description ?? "",
    descriptionEn: group?.descriptionEn ?? "",
  }));
  const [codeTouched, setCodeTouched] = useState(Boolean(group));
  const [lang, setLang] = useState<AdminContentLang>(locale === "en" ? "en" : "vi");
  const [nameError, setNameError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isNew = group === null;
  const codeLocked = group?.isSystem ?? false;
  const fields = LANG_FIELDS[lang];
  // Mã gợi ý từ tên: "Phong cách" → "PHONG-CACH"
  const effectiveCode = codeTouched ? values.code : toSlug(values.name).toUpperCase();

  const set = <K extends keyof AttributeGroupFormValues>(key: K, next: AttributeGroupFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: next }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setLang("vi");
      setNameError(true);
      return;
    }
    setIsSaving(true);
    try {
      const payload = { ...values, code: effectiveCode };
      if (isNew) {
        const res = await createAttributeGroupAction(payload);
        if (!res.success) {
          notify.error(res.error, "ATTRIBUTE_GROUP_CREATE_FAILED");
          return;
        }
        notify.success(t("groupDialog.created"));
        const { id, ...data } = res.data;
        onSaved(data, id);
      } else {
        const res = await updateAttributeGroupAction({ ...payload, groupId: group.id });
        if (!res.success) {
          notify.error(res.error, "ATTRIBUTE_GROUP_UPDATE_FAILED");
          return;
        }
        notify.success(t("groupDialog.updated"));
        onSaved(res.data, group.id);
      }
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      title={isNew ? t("groupDialog.createTitle") : t("groupDialog.editTitle", { name: group.name })}
      description={t("groupDialog.description")}
      size="lg"
      onSubmit={handleSubmit}
      bodyClassName="space-y-4"
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button type="submit" disabled={isSaving} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {isSaving ? t("processing") : isNew ? t("dialog.create") : t("dialog.save")}
          </button>
        </>
      }
    >
      <div key={lang} role="tabpanel" className="space-y-4">
        {/* Tên + công tắc VI / EN ngang hàng ô nhập (cùng khuôn dialog bảng size) */}
        <div className="flex items-end gap-3">
          <AdminTextField
            autoFocus
            required={lang === "vi"}
            className="min-w-0 flex-1"
            label={t("groupDialog.name")}
            value={values[fields.name]}
            onValueChange={(next) => {
              set(fields.name, next);
              if (lang === "vi") setNameError(false);
            }}
            placeholder={t(`groupDialog.placeholders.${lang}.name`)}
            error={lang === "vi" && nameError ? t("groupDialog.nameRequired") : undefined}
          />
          <div className="flex h-10 shrink-0 items-center">
            <AdminLangSwitch
              value={lang}
              onChange={setLang}
              label={t("dialog.langLabel")}
              status={{ en: values.nameEn ? undefined : "missing" }}
            />
          </div>
        </div>
        <AdminTextField
          label={t("field.code")}
          hint={codeLocked ? t("groupDialog.codeLocked") : t("groupDialog.codeHint")}
          value={effectiveCode}
          disabled={codeLocked}
          onValueChange={(next) => {
            setCodeTouched(true);
            set("code", next.toUpperCase());
          }}
          placeholder={t("placeholders.code")}
          inputClassName="font-mono uppercase"
          suffix={codeLocked ? <Lock size={13} className="text-[#A1A1AA]" aria-hidden /> : undefined}
        />
        <AdminTextArea
          label={t("field.description")}
          rows={2}
          value={values[fields.description]}
          onValueChange={(next) => set(fields.description, next)}
          placeholder={t(`groupDialog.placeholders.${lang}.description`)}
        />
      </div>
    </AdminDialog>
  );
}
