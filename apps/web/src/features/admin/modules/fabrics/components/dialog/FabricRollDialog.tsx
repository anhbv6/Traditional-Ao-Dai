"use client";

import { useState, type FormEvent } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminField,
  AdminFilterSelect,
  AdminLangSwitch,
  AdminTextField,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import {
  type AdminFabricRoll,
  type FabricColorOption,
  type FabricMaterialOption,
  type FabricProductOption,
  type FabricRollInput,
} from "../../types/fabrics.types";
import { buildFabricCode, parseMeters, suggestThreshold } from "../../utils/fabricStock";
import { FabricSwatch } from "../shared/FabricSwatch";

const NO_PRODUCT = "NONE";

interface FabricRollDialogProps {
  /** null = nhập cây vải mới */
  roll: AdminFabricRoll | null;
  materials: FabricMaterialOption[];
  colors: FabricColorOption[];
  products: FabricProductOption[];
  existingCodes: string[];
  /** Chất liệu chọn sẵn khi mở từ thẻ chất liệu */
  defaultMaterialId?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: FabricRollInput) => void;
}

/**
 * Nhập cây vải mới / sửa thông tin cây vải. Ít trường nên dùng dialog (ngoại lệ quy tắc màn chi tiết như loại sản phẩm).
 * Hỗ trợ chuyển đổi ngôn ngữ VI / EN qua AdminLangSwitch:
 * - Tên tiếng Việt bắt buộc, tự gợi ý "<chất liệu> <màu>".
 * - Tên tiếng Anh tùy chọn, tự gợi ý theo tên EN của chất liệu và màu.
 * Mã tự gợi ý theo chất liệu + màu; ngưỡng gợi ý = một bộ áo + quần theo định mức.
 * Khi sửa KHÔNG đổi số mét ở đây — số mét chỉ đổi qua biến động (nhập thêm / kiểm kê) để còn lịch sử.
 */
export function FabricRollDialog({
  roll,
  materials,
  colors,
  products,
  existingCodes,
  defaultMaterialId,
  onOpenChange,
  onSubmit,
}: FabricRollDialogProps) {
  const t = useTranslations("AdminPage.fabrics");
  const locale = useLocale();
  const format = useFormatter();
  const [contentLang, setContentLang] = useState<AdminContentLang>("vi");
  const [materialId, setMaterialId] = useState(roll?.materialId ?? defaultMaterialId ?? "");
  const [colorId, setColorId] = useState(roll?.colorId ?? "");
  const [name, setName] = useState(roll?.name ?? "");
  const [nameEn, setNameEn] = useState(roll?.nameEn ?? "");
  const [nameTouched, setNameTouched] = useState(Boolean(roll));
  const [nameEnTouched, setNameEnTouched] = useState(Boolean(roll?.nameEn));
  const [metersRaw, setMetersRaw] = useState("");
  const [thresholdRaw, setThresholdRaw] = useState(roll ? String(roll.lowStockThreshold) : "");
  const [productId, setProductId] = useState(roll?.productId ?? NO_PRODUCT);
  const [showErrors, setShowErrors] = useState(false);

  const material = materials.find((item) => item.id === materialId);
  const color = colors.find((item) => item.id === colorId);
  const localized = (item: { name: string; nameEn: string | null }) => (locale === "en" && item.nameEn ? item.nameEn : item.name);

  // Gợi ý tên "<chất liệu> <màu>" tiếng Việt và tiếng Anh
  const effectiveName = nameTouched ? name : [material?.name, color?.name.toLowerCase()].filter(Boolean).join(" ");
  const effectiveNameEn = nameEnTouched
    ? nameEn
    : [material?.nameEn || material?.name, (color?.nameEn || color?.name)?.toLowerCase()].filter(Boolean).join(" ");

  const code =
    roll?.code ??
    (material && color ? buildFabricCode(material.code, color.name, existingCodes) : "");
  const thresholdSuggestion = suggestThreshold(material?.metersPerTop ?? null, material?.metersPerPants ?? null);
  const threshold = thresholdRaw.trim() ? parseMeters(thresholdRaw) : thresholdSuggestion;
  const meters = roll ? roll.receivedMeters : parseMeters(metersRaw);

  const errors = {
    material: !material ? t("rollDialog.errors.material") : null,
    color: !color ? t("rollDialog.errors.color") : null,
    name: !effectiveName.trim() ? t("rollDialog.errors.name") : null,
    meters: meters === null || meters <= 0 ? t("rollDialog.errors.meters") : null,
    threshold: threshold === null || threshold < 0 ? t("rollDialog.errors.threshold") : null,
  };
  const isValid = Object.values(errors).every((error) => error === null);
  const shown = (key: keyof typeof errors) => (showErrors ? (errors[key] ?? undefined) : undefined);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (!effectiveName.trim()) {
      setContentLang("vi");
    }
    if (!isValid || !material || !color || meters === null || threshold === null) return;
    onSubmit({
      materialId: material.id,
      colorId: color.id,
      name: effectiveName.trim(),
      nameEn: (nameEnTouched ? nameEn : effectiveNameEn).trim() || null,
      code,
      receivedMeters: meters,
      lowStockThreshold: threshold,
      productId: productId === NO_PRODUCT ? null : productId,
    });
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      title={roll ? t("rollDialog.editTitle") : t("rollDialog.createTitle")}
      description={roll ? t("rollDialog.editDescription") : t("rollDialog.createDescription")}
      size="lg"
      onSubmit={handleSubmit}
      headerAside={
        <div className="-mr-1 shrink-0">
          <AdminLangSwitch
            value={contentLang}
            onChange={setContentLang}
            label={t("rollDialog.langLabel")}
            status={{
              vi: showErrors && errors.name ? "error" : undefined,
              en: (nameEnTouched ? nameEn : effectiveNameEn).trim() ? undefined : "missing",
            }}
          />
        </div>
      }
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button type="submit" className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {roll ? t("rollDialog.save") : t("rollDialog.create")}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label={t("rollDialog.field.material")} required error={shown("material")}>
          <AdminFilterSelect
            value={materialId}
            onChange={setMaterialId}
            placeholder={t("rollDialog.placeholder.material")}
            invalid={Boolean(shown("material"))}
            options={materials.map((item) => ({ value: item.id, label: localized(item) }))}
            className="h-10 w-full"
          />
        </AdminField>

        <AdminField label={t("rollDialog.field.color")} hint={t("rollDialog.hint.color")} required error={shown("color")}>
          <AdminFilterSelect
            value={colorId}
            onChange={setColorId}
            placeholder={t("rollDialog.placeholder.color")}
            invalid={Boolean(shown("color"))}
            options={colors.map((item) => ({
              value: item.id,
              label: (
                <span className="flex min-w-0 items-center gap-2.5">
                  <FabricSwatch hex={item.hex ?? null} size="sm" />
                  <span className="truncate">{localized(item)}</span>
                </span>
              ),
              text: localized(item),
            }))}
            className="h-10 w-full"
          />
        </AdminField>

        <AdminTextField
          required={contentLang === "vi"}
          label={t("rollDialog.field.name")}
          value={contentLang === "vi" ? effectiveName : effectiveNameEn}
          onValueChange={(value) => {
            if (contentLang === "vi") {
              setNameTouched(true);
              setName(value);
            } else {
              setNameEnTouched(true);
              setNameEn(value);
            }
          }}
          placeholder={t("rollDialog.placeholder.name")}
          error={contentLang === "vi" ? shown("name") : undefined}
          className="sm:col-span-2"
        />

        <AdminTextField
          label={t("rollDialog.field.code")}
          hint={t("rollDialog.hint.code")}
          value={code}
          readOnly
          disabled
          placeholder={t("rollDialog.placeholder.code")}
          inputClassName="font-mono text-xs text-[#71717A] bg-[#FAFAFA]"
          className="sm:col-span-2"
        />

        {roll ? (
          <AdminField label={t("rollDialog.field.remaining")} hint={t("rollDialog.hint.remaining")}>
            <p className="flex h-10 items-center rounded-xl border border-dashed border-[#E4E4E7] px-3 font-mono text-sm tabular-nums text-[#3F3F46]">
              {format.number(roll.remainingMeters, { maximumFractionDigits: 2 })} m
            </p>
          </AdminField>
        ) : (
          <AdminTextField
            required
            label={t("rollDialog.field.meters")}
            hint={material?.widthCm ? t("rollDialog.hint.meters", { width: material.widthCm }) : undefined}
            value={metersRaw}
            onValueChange={(value) => setMetersRaw(value.replace(/[^0-9.,]/g, ""))}
            inputMode="decimal"
            placeholder={t("rollDialog.placeholder.meters")}
            error={shown("meters")}
            inputClassName="font-mono tabular-nums"
          />
        )}

        <AdminTextField
          label={t("rollDialog.field.threshold")}
          hint={t("rollDialog.hint.threshold")}
          value={thresholdRaw}
          onValueChange={(value) => setThresholdRaw(value.replace(/[^0-9.,]/g, ""))}
          inputMode="decimal"
          placeholder={t("rollDialog.placeholder.threshold", { value: format.number(thresholdSuggestion) })}
          error={shown("threshold")}
          inputClassName="font-mono tabular-nums"
        />

        <AdminField label={t("rollDialog.field.product")} hint={t("rollDialog.hint.product")} className="sm:col-span-2">
          <AdminFilterSelect
            value={productId}
            onChange={setProductId}
            options={[
              { value: NO_PRODUCT, label: t("rollDialog.noProduct") },
              ...products.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })),
            ]}
            className="h-10 w-full"
          />
        </AdminField>
      </div>
    </AdminDialog>
  );
}
