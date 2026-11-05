"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminInfoTip,
  AdminLangSwitch,
  AdminTextArea,
  AdminTextField,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { toSlug } from "@/features/admin/modules/products";
import { createAttributeAction, updateAttributeAction } from "../actions/attributes.actions";
import { type AttributeFormValues } from "../schemas/attributes.schemas";
import { type AdminAttributeValue } from "../types/attributes.types";
import {
  COLOR_FAMILIES,
  COLOR_FAMILY_HEX,
  suggestColorFamily,
  type AttributeGroup,
  type ColorFamily,
} from "../utils/attributeMeta";

type Lang = AdminContentLang;
const LANG_FIELDS = {
  vi: { name: "name", description: "description" },
  en: { name: "nameEn", description: "descriptionEn" },
} as const satisfies Record<Lang, Record<string, keyof AttributeFormValues>>;

function initialValues(group: AttributeGroup, value: AdminAttributeValue | null): AttributeFormValues {
  return {
    group,
    code: value?.code ?? "",
    name: value?.name ?? "",
    nameEn: value?.nameEn ?? "",
    description: value?.description ?? "",
    descriptionEn: value?.descriptionEn ?? "",
    hex: value?.hex ?? (group === "COLOR" ? "#8B1E3F" : ""),
    family: value?.family ?? "",
    isActive: value?.isActive ?? true,
  };
}

/** Dialog thêm / sửa một giá trị thuộc tính; nhóm màu có thêm bảng chọn màu và họ màu */
export function AttributeValueDialog({
  group,
  value,
  onOpenChange,
  onSaved,
}: {
  group: AttributeGroup;
  /** null = thêm mới */
  value: AdminAttributeValue | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (values: AdminAttributeValue[]) => void;
}) {
  const t = useTranslations("AdminPage.attributes");
  const locale = useLocale();
  const notify = useNotify();
  const [values, setValues] = useState(() => initialValues(group, value));
  const [codeTouched, setCodeTouched] = useState(Boolean(value));
  const [lang, setLang] = useState<Lang>(locale === "en" ? "en" : "vi");
  const [isSaving, setIsSaving] = useState(false);

  const isNew = value === null;
  const isColor = group === "COLOR";
  const fields = LANG_FIELDS[lang];
  // Mã gợi ý từ tên: "Đỏ đô" → "DO-DO"; size giữ nguyên ký hiệu "XL", "35"
  const effectiveCode = codeTouched ? values.code : toSlug(values.name).toUpperCase();
  // Chưa chọn họ màu thì tự gợi ý theo mã hex
  const suggested = isColor ? suggestColorFamily(values.hex) : null;
  const effectiveFamily: ColorFamily | "" = values.family || (suggested ?? "");

  const set = <K extends keyof AttributeFormValues>(key: K, next: AttributeFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: next }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setLang("vi");
      return;
    }
    setIsSaving(true);
    try {
      const payload = { ...values, code: effectiveCode, family: effectiveFamily };
      const res = isNew
        ? await createAttributeAction(payload)
        : await updateAttributeAction({ ...payload, attributeId: value.id });
      if (!res.success) {
        notify.error(res.error, isNew ? "ATTRIBUTE_CREATE_FAILED" : "ATTRIBUTE_UPDATE_FAILED");
        return;
      }
      notify.success(isNew ? t("dialog.created") : t("dialog.updated"));
      onSaved(res.data.values);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const groupLabel = t(`group.${group}.label`);

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={isNew ? Plus : Pencil}
      title={isNew ? t("dialog.createTitle", { group: groupLabel.toLowerCase() }) : t("dialog.editTitle", { name: value.name })}
      description={t(`group.${group}.hint`)}
      size="lg"
      onSubmit={handleSubmit}
      bodyClassName="space-y-4"
      headerAside={
        <AdminLangSwitch
          value={lang}
          onChange={setLang}
          label={t("dialog.langLabel")}
          className="mt-1"
        />
      }
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isSaving || !values.name.trim() || !effectiveCode}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {isSaving ? t("processing") : isNew ? t("dialog.create") : t("dialog.save")}
          </button>
        </>
      }
    >
      <div key={lang} role="tabpanel" className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
        <AdminTextField
          autoFocus
          required={lang === "vi"}
          label={t("field.name")}
          value={values[fields.name]}
          onValueChange={(value) => set(fields.name, value)}
          placeholder={t(`placeholders.${lang}.name`, { group: groupLabel.toLowerCase() })}
        />
        <AdminTextField
          label={t("field.code")}
          hint={t("hints.code")}
          value={effectiveCode}
          onValueChange={(value) => {
            setCodeTouched(true);
            set("code", value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""));
          }}
          placeholder={t("placeholders.code")}
          inputClassName="font-mono"
        />
      </div>
      <AdminTextArea
        label={t("field.description")}
        value={values[fields.description]}
        onValueChange={(value) => set(fields.description, value)}
        rows={2}
        placeholder={t(`placeholders.${lang}.description`)}
      />

      {isColor && (
        <div className="space-y-4 border-t border-dashed border-[#E4E4E7] pt-4">
          <AdminTextField
            label={t("field.hex")}
            value={values.hex}
            onValueChange={(value) => set("hex", value.toUpperCase().slice(0, 7))}
            placeholder="#8B1E3F"
            inputClassName="font-mono uppercase"
            prefix={
              /* Ô chọn màu nằm trong slot đầu — gõ mã hex hoặc chọn bằng bảng màu đều được */
              <input
                type="color"
                value={/^#[0-9A-F]{6}$/i.test(values.hex) ? values.hex : "#000000"}
                onChange={(e) => set("hex", e.target.value.toUpperCase())}
                aria-label={t("field.hex")}
                className="size-6 cursor-pointer rounded-md border-0 bg-transparent p-0"
              />
            }
          />
          <fieldset className="space-y-1.5">
            <legend className="flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
              {t("field.family")}
              <AdminInfoTip content={t("hints.family")} />
            </legend>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {COLOR_FAMILIES.map((family) => {
                const selected = effectiveFamily === family;
                return (
                  <button
                    key={family}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => set("family", family)}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-1 py-2 text-2xs font-medium transition-colors",
                      selected
                        ? "border-[#18181B] bg-[#FAFAFA] text-[#09090B]"
                        : "border-transparent text-[#71717A] hover:border-[#E4E4E7]"
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-5 rounded-full border border-black/10"
                      style={{ background: COLOR_FAMILY_HEX[family] }}
                    />
                    {t(`family.${family}`)}
                  </button>
                );
              })}
            </div>
            {!values.family && suggested && (
              <p className="text-xs text-[#71717A]">{t("dialog.familySuggested", { family: t(`family.${suggested}`) })}</p>
            )}
          </fieldset>
        </div>
      )}

      <label className="flex cursor-pointer items-start justify-between gap-3 border-t border-dashed border-[#E4E4E7] pt-4">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#09090B]">{t("field.isActive")}</span>
          <span className="mt-0.5 block text-2xs leading-4 text-[#A1A1AA]">{t("hints.isActive")}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#18181B]/25",
            values.isActive ? "bg-[#18181B]" : "bg-[#E4E4E7]"
          )}
        >
          <span
            className={cn(
              "size-4 rounded-full bg-white shadow-xs transition-transform",
              values.isActive ? "translate-x-[18px]" : "translate-x-0.5"
            )}
          />
        </span>
      </label>
    </AdminDialog>
  );
}
