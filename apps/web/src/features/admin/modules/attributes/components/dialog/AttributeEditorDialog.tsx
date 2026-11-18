"use client";

import { useState, type FormEvent } from "react";
import { Lock, Pipette } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminLangSwitch,
  AdminTextArea,
  AdminTextField,
  AdminTooltip,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { toSlug } from "@/features/admin/modules/products";
import {
  createAttributeAction,
  createAttributeGroupAction,
  updateAttributeAction,
  updateAttributeGroupAction,
} from "../../actions/attributes.actions";
import { type AttributeFormValues, type AttributeGroupFormValues } from "../../schemas/attributes.schemas";
import { type AdminAttributeData, type AdminAttributeGroup, type AdminAttributeValue } from "../../types/attributes.types";
import {
  COLOR_FAMILIES,
  COLOR_FAMILY_HEX,
  COLOR_PRESETS_BY_FAMILY,
  type ColorFamily,
  type ColorPreset,
  localizedGroup,
  suggestColorFamily,
} from "../../utils/attributeMeta";

export type AttributeEditorTarget =
  | { type: "group"; group: AdminAttributeGroup | null }
  | { type: "value"; group: AdminAttributeGroup; value: AdminAttributeValue | null };

export interface AttributeEditorDialogProps {
  target: AttributeEditorTarget;
  onOpenChange: (open: boolean) => void;
  onSaved: (data: AdminAttributeData, targetGroupId?: string) => void;
}

const GROUP_LANG_FIELDS = {
  vi: { name: "name", description: "description" },
  en: { name: "nameEn", description: "descriptionEn" },
} as const satisfies Record<AdminContentLang, Record<string, keyof AttributeGroupFormValues>>;

const VALUE_LANG_FIELDS = {
  vi: { name: "name", description: "description" },
  en: { name: "nameEn", description: "descriptionEn" },
} as const satisfies Record<AdminContentLang, Record<string, keyof AttributeFormValues>>;

function initialValueForm(group: AdminAttributeGroup, value: AdminAttributeValue | null): AttributeFormValues {
  return {
    groupId: group.id,
    code: value?.code ?? "",
    name: value?.name ?? "",
    nameEn: value?.nameEn ?? "",
    description: value?.description ?? "",
    descriptionEn: value?.descriptionEn ?? "",
    hex: value?.hex ?? (group.code === "COLOR" ? "#C0262D" : ""),
    family: value?.family ?? "",
    isActive: value?.isActive ?? true,
  };
}

/** Form tạo / sửa nhóm thuộc tính cha */
function GroupEditorForm({
  group,
  onOpenChange,
  onSaved,
}: {
  group: AdminAttributeGroup | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (data: AdminAttributeData, targetGroupId?: string) => void;
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
  const fields = GROUP_LANG_FIELDS[lang];
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
      size="xl"
      className="sm:min-h-[380px]"
      onSubmit={handleSubmit}
      bodyClassName="space-y-3.5 min-h-[220px]"
      headerAside={
        <AdminLangSwitch
          value={lang}
          onChange={setLang}
          label={t("dialog.langLabel")}
          status={{ en: values.nameEn ? undefined : "missing" }}
          className="mt-1"
        />
      }
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
      <div key={lang} role="tabpanel" className="space-y-3.5">
        <AdminTextField
          autoFocus
          required={lang === "vi"}
          label={t("groupDialog.name")}
          value={values[fields.name]}
          onValueChange={(next) => {
            set(fields.name, next);
            if (lang === "vi") setNameError(false);
          }}
          placeholder={t(`groupDialog.placeholders.${lang}.name`)}
          error={lang === "vi" && nameError ? t("groupDialog.nameRequired") : undefined}
        />
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

/** Form tạo / sửa giá trị thuộc tính con (màu, size, đặc tính) */
function ValueEditorForm({
  group,
  value,
  onOpenChange,
  onSaved,
}: {
  group: AdminAttributeGroup;
  value: AdminAttributeValue | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (data: AdminAttributeData) => void;
}) {
  const t = useTranslations("AdminPage.attributes");
  const locale = useLocale();
  const notify = useNotify();

  const [values, setValues] = useState(() => initialValueForm(group, value));
  const [codeTouched, setCodeTouched] = useState(Boolean(value));
  const [lang, setLang] = useState<AdminContentLang>(locale === "en" ? "en" : "vi");
  const [isSaving, setIsSaving] = useState(false);

  const isNew = value === null;
  const isColor = group.code === "COLOR";
  const fields = VALUE_LANG_FIELDS[lang];
  const effectiveCode = codeTouched ? values.code : toSlug(values.name).toUpperCase();
  const suggested = isColor ? suggestColorFamily(values.hex) : null;
  const effectiveFamily: ColorFamily | "" = values.family || (suggested ?? "");

  const isValidHex = /^#[0-9A-F]{6}$/i.test(values.hex);
  const currentPresets: ColorPreset[] = effectiveFamily ? COLOR_PRESETS_BY_FAMILY[effectiveFamily] ?? [] : [];

  const set = <K extends keyof AttributeFormValues>(key: K, next: AttributeFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: next }));

  /** Khi đổi mã HEX (gõ tay hoặc qua color picker native) */
  const handleHexChange = (nextHex: string) => {
    const formatted = nextHex.startsWith("#") ? nextHex : `#${nextHex}`;
    const upper = formatted.toUpperCase();
    const autoFamily = suggestColorFamily(upper);
    setValues((prev) => ({
      ...prev,
      hex: upper,
      family: autoFamily || prev.family,
    }));
  };

  /** Khi bấm chọn một họ màu trong 12 chấm màu */
  const handleSelectFamily = (family: ColorFamily) => {
    const presets = COLOR_PRESETS_BY_FAMILY[family];
    const first = presets?.[0];
    setValues((prev) => {
      const shouldAutoFillName = !prev.name.trim();
      return {
        ...prev,
        family,
        hex: first ? first.hex : prev.hex,
        name: shouldAutoFillName && first ? first.name : prev.name,
        nameEn: shouldAutoFillName && first ? first.nameEn : prev.nameEn,
      };
    });
  };

  /** Khi bấm vào một sắc thái màu gợi ý */
  const handleSelectPreset = (preset: ColorPreset) => {
    setValues((prev) => {
      const shouldAutoFillName = !prev.name.trim();
      return {
        ...prev,
        hex: preset.hex,
        name: shouldAutoFillName ? preset.name : prev.name,
        nameEn: shouldAutoFillName ? preset.nameEn : prev.nameEn,
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      onSaved(res.data);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const { name: groupLabel, description: groupDescription } = localizedGroup(group, locale);

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      title={
        isNew
          ? t("dialog.createTitle", { group: groupLabel.toLowerCase() })
          : t("dialog.editTitle", { name: value.name })
      }
      description={groupDescription || undefined}
      size="xl"
      className="sm:min-h-[515px]"
      onSubmit={handleSubmit}
      bodyClassName="space-y-3 min-h-[385px]"
      headerAside={<AdminLangSwitch value={lang} onChange={setLang} label={t("dialog.langLabel")} className="mt-1" />}
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
      {/* Tên & Mã thuộc tính */}
      <div key={lang} role="tabpanel" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
        <AdminTextField
          autoFocus
          required={lang === "vi"}
          label={t("field.name")}
          value={values[fields.name]}
          onValueChange={(next) => set(fields.name, next)}
          placeholder={t(`placeholders.${lang}.name`, { group: groupLabel.toLowerCase() })}
        />
        <AdminTextField
          label={t("field.code")}
          hint={t("hints.code")}
          value={effectiveCode}
          onValueChange={(next) => {
            setCodeTouched(true);
            set("code", next.toUpperCase().replace(/[^A-Z0-9_-]/g, ""));
          }}
          placeholder={t("placeholders.code")}
          inputClassName="font-mono"
        />
      </div>

      {/* Mô tả ngắn gọn (1 dòng tiết kiệm chiều cao) */}
      <AdminTextField
        label={t("field.description")}
        value={values[fields.description]}
        onValueChange={(next) => set(fields.description, next)}
        placeholder={t(`placeholders.${lang}.description`)}
      />

      {/* Khối gộp thống nhất: Pick màu, Mã HEX, Họ màu & Sắc thái màu (Chiều cao ổn định - Không giật layout) */}
      {isColor && (
        <div className="rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-3 space-y-2.5">
          {/* Hàng 1: Tiêu đề + Họ màu nhận diện */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#09090B]">{t("field.colorSection")}</span>
            {effectiveFamily ? (
              <span className="text-2xs text-[#71717A]">
                {t("field.family")}: <strong className="font-medium text-[#09090B]">{t(`family.${effectiveFamily}`)}</strong>
              </span>
            ) : null}
          </div>

          {/* Hàng 2: Color Picker + Input HEX + Dải 12 chấm họ màu */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Ô bấm pick màu trực tiếp */}
            <AdminTooltip content={t("field.pickColor")}>
              <label
                htmlFor="attribute-color-picker"
                className="group/picker relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-black/10 shadow-2xs transition-transform hover:scale-105"
                style={{ background: isValidHex ? values.hex : "#C0262D" }}
              >
                <input
                  id="attribute-color-picker"
                  type="color"
                  value={isValidHex ? values.hex : "#C0262D"}
                  onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
                  className="sr-only"
                />
                <div className="grid size-5 place-items-center rounded-full bg-black/30 text-white backdrop-blur-xs">
                  <Pipette size={11} aria-hidden />
                </div>
              </label>
            </AdminTooltip>

            {/* Ô nhập mã HEX gọn gàng */}
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[#71717A]">
                #
              </span>
              <input
                type="text"
                value={values.hex.replace(/^#/, "")}
                onChange={(e) =>
                  handleHexChange(`#${e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6)}`.toUpperCase())
                }
                placeholder="C0262D"
                maxLength={6}
                aria-label={t("field.hex")}
                className="h-9 w-24 rounded-lg border border-[#E4E4E7] bg-white pl-6 pr-2 font-mono text-xs font-semibold uppercase text-[#09090B] outline-none transition-colors focus:border-[#18181B]"
              />
            </div>

            {/* Dải 12 chấm họ màu tròn - Không bao giờ bị cắt chữ */}
            <div className="ml-auto flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={t("field.family")}>
              {COLOR_FAMILIES.map((family) => {
                const isSelected = effectiveFamily === family;
                return (
                  <AdminTooltip key={family} content={t(`family.${family}`)}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={t(`family.${family}`)}
                      onClick={() => handleSelectFamily(family)}
                      className={cn(
                        "relative grid size-6 cursor-pointer place-items-center rounded-full transition-transform hover:scale-110",
                        isSelected
                          ? "ring-2 ring-[#18181B] ring-offset-2 scale-105"
                          : "opacity-80 hover:opacity-100"
                      )}
                    >
                      <span
                        className="size-4.5 rounded-full border border-black/15 shadow-2xs"
                        style={{ background: COLOR_FAMILY_HEX[family] }}
                      />
                    </button>
                  </AdminTooltip>
                );
              })}
            </div>
          </div>

          {/* Hàng 3: Sắc thái gợi ý theo họ màu đang chọn - Hiển thị đủ 2 dòng không bị cắt xén viền */}
          <div className="border-t border-[#E4E4E7] pt-2 min-h-[92px]">
            <div className="mb-1.5 flex items-center justify-between text-2xs text-[#71717A]">
              <span>{t("field.colorPresets")}:</span>
              <span className="text-[#A1A1AA]">{t("hints.clickPreset")}</span>
            </div>
            {currentPresets.length > 0 ? (
              <div className="flex max-h-[66px] flex-wrap gap-1.5 overflow-hidden content-start">
                {currentPresets.slice(0, 8).map((preset) => {
                  const isActive = values.hex.toUpperCase() === preset.hex.toUpperCase();
                  const presetName = lang === "en" ? preset.nameEn : preset.name;
                  return (
                    <AdminTooltip key={preset.hex} content={`${presetName} (${preset.hex})`}>
                      <button
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={cn(
                          "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors",
                          isActive
                            ? "border-[#18181B] bg-[#18181B] text-white shadow-2xs font-medium"
                            : "border-[#E4E4E7] bg-white text-[#3F3F46] hover:border-[#A1A1AA] hover:bg-[#FAFAFA]"
                        )}
                      >
                        <span
                          className="size-2 shrink-0 rounded-full border border-black/10"
                          style={{ background: preset.hex }}
                        />
                        <span>{presetName}</span>
                      </button>
                    </AdminTooltip>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-12 items-center justify-center text-2xs text-[#A1A1AA]">
                {t("hints.pickColorHint")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trạng thái hiển thị */}
      <label className="flex cursor-pointer items-start justify-between gap-3 pt-2.5">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-[#09090B]">{t("field.isActive")}</span>
          <span className="mt-0.5 block text-xs leading-4 text-[#71717A]">{t("hints.isActive")}</span>
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

/**
 * Dialog duy nhất tích hợp toàn bộ thao tác Tạo mới & Chỉnh sửa:
 * - Nhóm thuộc tính cha (group = null: tạo nhóm mới, group != null: sửa nhóm)
 * - Giá trị thuộc tính con (value = null: tạo giá trị mới, value != null: sửa giá trị)
 */
export function AttributeEditorDialog({ target, onOpenChange, onSaved }: AttributeEditorDialogProps) {
  if (target.type === "group") {
    return (
      <GroupEditorForm
        key={target.group?.id ?? "new-group"}
        group={target.group}
        onOpenChange={onOpenChange}
        onSaved={onSaved}
      />
    );
  }

  return (
    <ValueEditorForm
      key={target.value?.id ?? `new-${target.group.id}`}
      group={target.group}
      value={target.value}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
    />
  );
}
