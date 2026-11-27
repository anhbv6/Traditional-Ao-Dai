"use client";

import { useState, type FormEvent } from "react";
import { Trash2, X } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminField,
  AdminFilterSelect,
  AdminLangSwitch,
  AdminSwitch,
  AdminTextField,
  AdminTooltip,
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

interface FabricRollDialogProps {
  /** null = nhập cây vải mới */
  roll: AdminFabricRoll | null;
  materials: FabricMaterialOption[];
  colors?: FabricColorOption[];
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
  colors: _colors,
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
  const [isCustomSpecs, setIsCustomSpecs] = useState(Boolean(roll?.widthCm || roll?.metersPerTop));
  const [customWidthRaw, setCustomWidthRaw] = useState(roll?.widthCm ? String(roll.widthCm) : "");
  const [customMetersPerTopRaw, setCustomMetersPerTopRaw] = useState(roll?.metersPerTop ? String(roll.metersPerTop) : "");
  const [showErrors, setShowErrors] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  const material = materials.find((item) => item.id === materialId);
  const localized = (item: { name: string; nameEn: string | null }) => (locale === "en" && item.nameEn ? item.nameEn : item.name);

  // Danh sách các mẫu áo đang sử dụng chất liệu này (tự động theo materialId)
  const relatedProducts = materialId ? products.filter((item) => item.materialId === materialId) : [];

  const selectedColor = _colors?.find((c) => c.id === colorId);
  const availableColors = materialId
    ? (_colors ?? []).filter((c) => material?.colorIds?.includes(c.id))
    : [];
  const inheritedImage = isImageDeleted
    ? null
    : (roll?.image ??
      material?.colorImages?.find((ci) => ci.colorId === colorId)?.image ??
      material?.colorImages?.find((ci) => ci.colorId === colorId)?.images?.[0] ??
      material?.closeupImages?.[0] ??
      null);

  // Gợi ý tên cây vải theo chất liệu + màu
  const colorName = selectedColor ? (locale === "en" && selectedColor.nameEn ? selectedColor.nameEn : selectedColor.name) : "";
  const effectiveName = nameTouched
    ? name
    : material
      ? (colorName ? `${material.name} ${selectedColor?.name ?? ""}`.trim() : material.name)
      : "";
  const effectiveNameEn = nameEnTouched
    ? nameEn
    : material
      ? (selectedColor
          ? `${material.nameEn || material.name} ${selectedColor.nameEn || selectedColor.name}`.trim()
          : (material.nameEn || material.name))
      : "";

  const code =
    roll?.code ??
    (material ? buildFabricCode(material.code, selectedColor?.name ?? "", existingCodes) : "");

  const parsedCustomWidth = customWidthRaw.trim() ? Number(customWidthRaw) : null;
  const parsedCustomMetersPerTop = customMetersPerTopRaw.trim() ? parseMeters(customMetersPerTopRaw) : null;

  const effectiveMetersPerTop = isCustomSpecs
    ? (parsedCustomMetersPerTop ?? material?.metersPerTop ?? null)
    : (material?.metersPerTop ?? null);
  const effectiveWidthCm = isCustomSpecs
    ? (parsedCustomWidth ?? material?.widthCm ?? null)
    : (material?.widthCm ?? null);

  const thresholdSuggestion = suggestThreshold(effectiveMetersPerTop, material?.metersPerPants ?? null);
  const threshold = thresholdRaw.trim() ? parseMeters(thresholdRaw) : thresholdSuggestion;
  const meters = roll ? roll.receivedMeters : parseMeters(metersRaw);

  const errors = {
    material: !material ? t("rollDialog.errors.material") : null,
    name: !effectiveName.trim() ? t("rollDialog.errors.name") : null,
    meters: meters === null || meters <= 0 ? t("rollDialog.errors.meters") : null,
    threshold: threshold === null || threshold < 0 ? t("rollDialog.errors.threshold") : null,
    customWidth:
      isCustomSpecs && parsedCustomWidth !== null && (parsedCustomWidth < 30 || parsedCustomWidth > 400 || !Number.isInteger(parsedCustomWidth))
        ? t("rollDialog.errors.customWidth")
        : null,
    customMetersPerTop:
      isCustomSpecs && parsedCustomMetersPerTop !== null && (parsedCustomMetersPerTop <= 0 || parsedCustomMetersPerTop > 20)
        ? t("rollDialog.errors.customMetersPerTop")
        : null,
  };
  const isValid = Object.values(errors).every((error) => error === null);
  const shown = (key: keyof typeof errors) => (showErrors ? (errors[key] ?? undefined) : undefined);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (!effectiveName.trim()) {
      setContentLang("vi");
    }
    if (!isValid || !material || meters === null || threshold === null) return;
    const autoProductId = roll?.productId ?? relatedProducts[0]?.id ?? null;

    onSubmit({
      materialId: material.id,
      colorId: colorId || null,
      name: effectiveName.trim(),
      nameEn: (nameEnTouched ? nameEn : effectiveNameEn).trim() || null,
      code,
      receivedMeters: meters,
      lowStockThreshold: threshold,
      productId: autoProductId,
      widthCm: isCustomSpecs ? parsedCustomWidth : null,
      metersPerTop: isCustomSpecs ? parsedCustomMetersPerTop : null,
      image: inheritedImage,
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
            onChange={(nextMatId) => {
              setMaterialId(nextMatId);
              const nextMat = materials.find((m) => m.id === nextMatId);
              if (nextMat?.colorIds && nextMat.colorIds.length > 0) {
                if (!nextMat.colorIds.includes(colorId)) {
                  setColorId(nextMat.colorIds[0]);
                }
              } else {
                setColorId("");
              }
            }}
            placeholder={t("rollDialog.placeholder.material")}
            invalid={Boolean(shown("material"))}
            options={materials.map((item) => ({ value: item.id, label: localized(item) }))}
            className="h-10 w-full"
          />
        </AdminField>

        <AdminField label={t("rollDialog.field.color")}>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <AdminFilterSelect
                value={colorId}
                onChange={setColorId}
                disabled={!materialId}
                placeholder={
                  !materialId
                    ? t("rollDialog.selectMaterialFirst")
                    : availableColors.length === 0
                      ? t("rollDialog.noColorsForMaterial")
                      : t("rollDialog.placeholder.color")
                }
                emptyText={
                  !materialId
                    ? t("rollDialog.selectMaterialFirst")
                    : t("rollDialog.noColorsForMaterial")
                }
                options={availableColors.map((c) => ({
                  value: c.id,
                  label: (
                    <span className="flex items-center gap-2">
                      {c.hex && (
                        <span
                          aria-hidden
                          className="size-3 shrink-0 rounded-full border border-black/15 shadow-2xs"
                          style={{ backgroundColor: c.hex }}
                        />
                      )}
                      <span>{c.name}</span>
                    </span>
                  ),
                  text: c.name,
                }))}
                className="h-10 w-full"
              />
            </div>
            {inheritedImage ? (
              <AdminTooltip content={t("rollDialog.swatchViewTooltip")}>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(inheritedImage)}
                  className="size-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-black/10 bg-[#FAFAFA] shadow-2xs transition-transform hover:scale-105 hover:ring-2 hover:ring-[#18181B]"
                  aria-label={t("rollDialog.swatchViewTooltip")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Preview ảnh mẫu vải kế thừa từ chất liệu (URL linh hoạt) */}
                  <img src={inheritedImage} alt="" className="size-full object-cover" />
                </button>
              </AdminTooltip>
            ) : selectedColor?.hex ? (
              <span
                className="size-10 shrink-0 rounded-xl border border-black/10 shadow-2xs"
                style={{ backgroundColor: selectedColor.hex }}
              />
            ) : null}
          </div>
        </AdminField>

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

        {/* Khổ vải & định mức: Mặc định theo chất liệu hoặc bật switch để nhập riêng */}
        <div className="space-y-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-3.5 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#09090B]">{t("rollDialog.customSpecsSwitch")}</p>
              <p className="mt-0.5 truncate text-2xs text-[#71717A]">
                {material?.widthCm
                  ? t("rollDialog.standardSpecs", {
                      width: material.widthCm,
                      perTop: material.metersPerTop ? format.number(material.metersPerTop) : "—",
                    })
                  : t("rollDialog.noStandardSpecs")}
              </p>
            </div>
            <AdminSwitch
              checked={isCustomSpecs}
              onChange={(checked) => {
                setIsCustomSpecs(checked);
                if (checked && !customWidthRaw && material?.widthCm) {
                  setCustomWidthRaw(String(material.widthCm));
                }
                if (checked && !customMetersPerTopRaw && material?.metersPerTop) {
                  setCustomMetersPerTopRaw(String(material.metersPerTop));
                }
              }}
              label={t("rollDialog.customSpecsSwitch")}
            />
          </div>

          {isCustomSpecs && (
            <div className="grid gap-3 border-t border-dashed border-[#E4E4E7] pt-3 sm:grid-cols-2">
              <AdminTextField
                label={t("rollDialog.field.customWidth")}
                hint={t("rollDialog.hint.customWidth")}
                value={customWidthRaw}
                onValueChange={(val) => setCustomWidthRaw(val.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder={material?.widthCm ? String(material.widthCm) : t("rollDialog.placeholder.customWidth")}
                error={shown("customWidth")}
                inputClassName="font-mono tabular-nums"
              />
              <AdminTextField
                label={t("rollDialog.field.customMetersPerTop")}
                hint={t("rollDialog.hint.customMetersPerTop")}
                value={customMetersPerTopRaw}
                onValueChange={(val) => setCustomMetersPerTopRaw(val.replace(/[^0-9.,]/g, ""))}
                inputMode="decimal"
                placeholder={material?.metersPerTop ? String(material.metersPerTop) : t("rollDialog.placeholder.customMetersPerTop")}
                error={shown("customMetersPerTop")}
                inputClassName="font-mono tabular-nums"
              />
            </div>
          )}
        </div>

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
            hint={effectiveWidthCm ? t("rollDialog.hint.meters", { width: effectiveWidthCm }) : undefined}
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

        {/* Danh sách các mẫu áo may từ chất liệu này (Tự động phát hiện) */}
        <div className="sm:col-span-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-[#09090B]">{t("rollDialog.relatedProductsTitle")}</span>
            <span className="text-2xs text-[#71717A]">
              {relatedProducts.length > 0
                ? t("rollDialog.relatedCount", { count: relatedProducts.length })
                : t("rollDialog.noRelatedProducts")}
            </span>
          </div>

          {relatedProducts.length > 0 ? (
            <div className="flex flex-wrap gap-2 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-2.5">
              {relatedProducts.map((p) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-1 text-xs text-[#3F3F46] shadow-2xs"
                >
                  <span className="font-mono text-2xs font-semibold text-[#71717A]">{p.code}</span>
                  <span className="font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#E4E4E7] bg-[#FAFAFA] p-3 text-center text-xs text-[#71717A]">
              {materialId ? t("rollDialog.emptyRelatedForMaterial") : t("rollDialog.selectMaterialFirst")}
            </div>
          )}
        </div>
      </div>

      {/* Dialog xem ảnh chi tiết khi click vào ảnh swatch nhỏ */}
      {previewImageUrl && (
        <AdminDialog
          open={Boolean(previewImageUrl)}
          onOpenChange={(open) => {
            if (!open) setPreviewImageUrl(null);
          }}
          title={<span className="sr-only">{t("rollDialog.swatchPreviewTitle")}</span>}
          bare
          disableDivider
          size="sm"
          className="max-w-[340px] overflow-hidden rounded-2xl sm:max-w-[400px] [&>header]:hidden"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F4F4F5]">
            {/* eslint-disable-next-line @next/next/no-img-element -- Preview ảnh mẫu vải phóng to */}
            <img
              src={previewImageUrl}
              alt=""
              className="size-full select-none object-cover"
            />

            {/* Góc trên bên trái: Tag trạng thái Nháp */}
            {previewImageUrl.startsWith("blob:") && (
              <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-amber-500/95 px-2 py-0.5 text-xs font-semibold text-white shadow-md backdrop-blur-xs">
                {t("rollDialog.draftBadge")}
              </span>
            )}

            {/* Góc trên bên phải: Icon thùng rác xóa ảnh và nút Đóng */}
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
              <button
                type="button"
                title={t("rollDialog.removePhoto")}
                aria-label={t("rollDialog.removePhoto")}
                onClick={() => {
                  setIsImageDeleted(true);
                  setPreviewImageUrl(null);
                }}
                className="grid size-8 cursor-pointer place-items-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-xs transition-colors hover:bg-rose-600 focus-visible:outline-none"
              >
                <Trash2 size={15} />
              </button>

              <button
                type="button"
                title={t("rollDialog.close")}
                aria-label={t("rollDialog.close")}
                onClick={() => setPreviewImageUrl(null)}
                className="grid size-8 cursor-pointer place-items-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-xs transition-colors hover:bg-black/80 focus-visible:outline-none"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </AdminDialog>
      )}
    </AdminDialog>
  );
}
