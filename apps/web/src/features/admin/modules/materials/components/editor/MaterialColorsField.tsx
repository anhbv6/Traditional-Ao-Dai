"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pipette, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminImageSlot,
  AdminLangSwitch,
  AdminMultiSelect,
  AdminTextField,
  AdminTooltip,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { toSlug } from "@/features/admin/modules/products";
import {
  COLOR_FAMILIES,
  COLOR_FAMILY_HEX,
  COLOR_PRESETS_BY_FAMILY,
  type ColorFamily,
  type ColorPreset,
  suggestColorFamily,
} from "@/features/admin/modules/attributes";
import { createMaterialColorAction } from "../../actions/materials.actions";
import { type MaterialColorImage, type MaterialColorOption } from "../../types/materials.types";

interface MaterialColorsFieldProps {
  colorIds: string[];
  colorImages?: MaterialColorImage[];
  availableColors: MaterialColorOption[];
  onChange: (colorIds: string[]) => void;
  onColorImagesChange?: (colorImages: MaterialColorImage[]) => void;
  onColorCreated?: (newColor: MaterialColorOption) => void;
}

/**
 * Trường cấu hình bảng màu của chất liệu vải:
 * - Chọn nhiều màu từ danh mục hệ thống bằng AdminMultiSelect có swatch trực quan
 * - Hiển thị danh sách chip màu đã chọn (cho phép xóa nhanh)
 * - Nút "+ Tạo màu mới" mở Dialog tạo giá trị màu mới tương đồng 100% với phân hệ Thuộc tính (Attributes)
 *   (AdminLangSwitch VI/EN, mã code tự sinh, bộ chọn màu Pipette, dải 12 chấm họ màu & gợi ý sắc thái màu).
 */
export function MaterialColorsField({
  colorIds,
  colorImages = [],
  availableColors,
  onChange,
  onColorImagesChange,
  onColorCreated,
}: MaterialColorsFieldProps) {
  const t = useTranslations("AdminPage.materials");
  const tAttr = useTranslations("AdminPage.attributes");
  const notify = useNotify();
  const [isPending, startTransition] = useTransition();

  // State Dialog tạo màu mới
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [lang, setLang] = useState<AdminContentLang>("vi");
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [hex, setHex] = useState("#C0262D");
  const [family, setFamily] = useState<ColorFamily | "">("RED");
  const [nameError, setNameError] = useState(false);

  const selectedColors = colorIds
    .map((id) => availableColors.find((c) => c.id === id))
    .filter((c): c is MaterialColorOption => Boolean(c));

  const primaryColor = selectedColors[0] ?? null;
  const secondaryColors = selectedColors.slice(1);

  const multiSelectOptions = availableColors.map((c) => ({
    value: c.id,
    label: c.name,
    colorHex: c.hex,
  }));

  const handleRemoveColor = (idToRemove: string) => {
    onChange(colorIds.filter((id) => id !== idToRemove));
    if (onColorImagesChange) {
      onColorImagesChange(colorImages.filter((ci) => ci.colorId !== idToRemove));
    }
  };

  const handleUpdateColorSlot = (colorId: string, slotIndex: number, newUrl: string) => {
    if (!onColorImagesChange) return;

    const prevEntry = colorImages.find((ci) => ci.colorId === colorId);
    const prevImgs =
      prevEntry?.images && prevEntry.images.length > 0
        ? [...prevEntry.images]
        : prevEntry?.image
          ? [prevEntry.image]
          : [];

    if (!newUrl) {
      const nextImgs = prevImgs.filter((_, idx) => idx !== slotIndex);
      if (nextImgs.length === 0) {
        onColorImagesChange(colorImages.filter((ci) => ci.colorId !== colorId));
      } else {
        onColorImagesChange(
          colorImages.map((ci) =>
            ci.colorId === colorId ? { colorId, image: nextImgs[0]!, images: nextImgs } : ci
          )
        );
      }
      return;
    }

    const nextImgs = [...prevImgs];
    if (slotIndex < nextImgs.length) {
      nextImgs[slotIndex] = newUrl;
    } else {
      nextImgs.push(newUrl);
    }
    const cappedImgs = nextImgs.slice(0, 2);

    const exists = colorImages.some((ci) => ci.colorId === colorId);
    if (exists) {
      onColorImagesChange(
        colorImages.map((ci) =>
          ci.colorId === colorId ? { colorId, image: cappedImgs[0]!, images: cappedImgs } : ci
        )
      );
    } else {
      onColorImagesChange([...colorImages, { colorId, image: cappedImgs[0]!, images: cappedImgs }]);
    }
  };

  const effectiveCode = codeTouched ? code : toSlug(name).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  const suggestedFamily = suggestColorFamily(hex);
  const effectiveFamily: ColorFamily | "" = family || (suggestedFamily ?? "");
  const isValidHex = /^#[0-9A-F]{6}$/i.test(hex);
  const currentPresets: ColorPreset[] = effectiveFamily ? COLOR_PRESETS_BY_FAMILY[effectiveFamily] ?? [] : [];

  /** Khi đổi mã HEX (gõ tay hoặc qua color picker native) */
  const handleHexChange = (nextHex: string) => {
    const formatted = nextHex.startsWith("#") ? nextHex : `#${nextHex}`;
    const upper = formatted.toUpperCase();
    const autoFamily = suggestColorFamily(upper);
    setHex(upper);
    if (autoFamily) setFamily(autoFamily);
  };

  /** Khi bấm chọn một họ màu trong 12 chấm họ màu */
  const handleSelectFamily = (selectedFam: ColorFamily) => {
    const presets = COLOR_PRESETS_BY_FAMILY[selectedFam];
    const first = presets?.[0];
    const shouldAutoFillName = !name.trim();

    setFamily(selectedFam);
    if (first) {
      setHex(first.hex);
      if (shouldAutoFillName) {
        setName(first.name);
        setNameEn(first.nameEn);
      }
    }
  };

  /** Khi bấm vào một sắc thái màu gợi ý */
  const handleSelectPreset = (preset: ColorPreset) => {
    const shouldAutoFillName = !name.trim();
    setHex(preset.hex);
    if (shouldAutoFillName) {
      setName(preset.name);
      setNameEn(preset.nameEn);
    }
  };

  const resetDialogForm = () => {
    setName("");
    setNameEn("");
    setCode("");
    setCodeTouched(false);
    setDescription("");
    setDescriptionEn("");
    setHex("#C0262D");
    setFamily("RED");
    setNameError(false);
    setLang("vi");
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setLang("vi");
      setNameError(true);
      return;
    }
    if (!isValidHex) {
      notify.error(t("colors.hexInvalid"));
      return;
    }

    startTransition(async () => {
      const res = await createMaterialColorAction({
        code: effectiveCode || undefined,
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        description: description.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        hex,
        family: effectiveFamily || undefined,
      });

      if (!res.success) {
        notify.error(res.error);
        return;
      }

      notify.success(t("colors.createSuccess"));
      onColorCreated?.(res.data);
      onChange([...colorIds, res.data.id]);

      resetDialogForm();
      setIsCreateOpen(false);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <AdminMultiSelect
            value={colorIds}
            options={multiSelectOptions}
            onChange={onChange}
            placeholder={t("colors.placeholder")}
            summaryFormatter={(count) => t("colors.summary", { count })}
            className="w-full"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E4E4E7] bg-white px-3.5 text-xs font-medium text-[#3F3F46] shadow-2xs transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
        >
          <Plus size={14} aria-hidden />
          <span>{t("colors.createButton")}</span>
        </button>
      </div>

      {/* Thanh hiển thị màu chủ đạo gọn gàng (không dùng chip rời rạc) */}
      {primaryColor && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E4E4E7] bg-white px-3.5 py-2 text-xs shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="size-3.5 shrink-0 rounded-full border border-black/15 shadow-2xs"
              style={{ backgroundColor: primaryColor.hex }}
              aria-hidden
            />
            <span className="font-semibold text-[#09090B]">{primaryColor.name}</span>
            <span className="rounded bg-[#18181B] px-1.5 py-0.5 text-2xs font-semibold text-white shadow-2xs">
              {t("colors.primaryBadge")}
            </span>
            <span className="text-2xs text-[#71717A]">
              {t("colors.primaryCoverHint")}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleRemoveColor(primaryColor.id)}
            className="grid size-5 cursor-pointer place-items-center rounded-full text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-rose-600"
            title={t("colors.removeColor", { name: primaryColor.name })}
            aria-label={t("colors.removeColor", { name: primaryColor.name })}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Danh sách thẻ ảnh gọn gàng cho các màu bổ sung (giao diện chuẩn như Ảnh 2) */}
      {secondaryColors.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#09090B]">
              {t("colors.secondaryTitle", { count: secondaryColors.length })}
            </span>
            <span className="text-2xs text-[#71717A]">
              {t("colors.secondaryHint")}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {secondaryColors.map((color) => {
              const entry = colorImages.find((ci) => ci.colorId === color.id);
              const images =
                entry?.images && entry.images.length > 0
                  ? entry.images
                  : entry?.image
                    ? [entry.image]
                    : [];

              return (
                <div
                  key={color.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#E4E4E7] bg-white p-2.5 shadow-2xs transition-colors hover:border-[#D4D4D8]"
                >
                  {/* Header thẻ: Tên màu + Chấm màu + Nút Đặt chủ đạo + Nút X gỡ màu */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="size-3 shrink-0 rounded-full border border-black/15 shadow-2xs"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden
                      />
                      <span className="truncate text-xs font-semibold text-[#09090B]">
                        {color.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const reordered = [color.id, ...colorIds.filter((id) => id !== color.id)];
                          onChange(reordered);
                        }}
                        className="cursor-pointer text-2xs text-[#71717A] hover:text-[#09090B] hover:underline"
                        title={t("colors.setPrimaryTooltip")}
                      >
                        {t("colors.setPrimary")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color.id)}
                        className="grid size-4.5 cursor-pointer place-items-center rounded-full text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-rose-600"
                        title={t("colors.removeColor", { name: color.name })}
                        aria-label={t("colors.removeColor", { name: color.name })}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Thân thẻ: Các ô ảnh theo giao diện Ảnh 2 */}
                  <div className="flex items-center gap-2">
                    {/* Ô ảnh 1 */}
                    <div className="size-24 shrink-0 sm:size-26">
                      <AdminImageSlot
                        value={images[0] || ""}
                        onChange={(url) => handleUpdateColorSlot(color.id, 0, url)}
                        aspectClass="aspect-square"
                        folder="general"
                        dashedPlaceholder
                        placeholderText={t("colors.addPhoto")}
                        replaceText={t("colors.changePhoto")}
                        badge={
                          images[0] ? (
                            <span className="rounded bg-[#18181B]/90 px-1.5 py-0.5 text-2xs font-medium text-white shadow-2xs">
                              {t("colors.photo1")}
                            </span>
                          ) : undefined
                        }
                      />
                    </div>

                    {/* Ô ảnh 2 (chỉ hiện khi ô 1 đã có ảnh) */}
                    {images[0] && (
                      <div className="size-24 shrink-0 sm:size-26">
                        <AdminImageSlot
                          value={images[1] || ""}
                          onChange={(url) => handleUpdateColorSlot(color.id, 1, url)}
                          aspectClass="aspect-square"
                          folder="general"
                          dashedPlaceholder
                          placeholderText={t("colors.addPhoto")}
                          replaceText={t("colors.changePhoto")}
                          badge={
                            images[1] ? (
                              <span className="rounded bg-[#18181B]/90 px-1.5 py-0.5 text-2xs font-medium text-white shadow-2xs">
                                {t("colors.photo2")}
                              </span>
                            ) : undefined
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog tạo màu mới tương đồng 100% với module Thuộc tính */}
      {isCreateOpen && (
        <AdminDialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetDialogForm();
          }}
          title={t("colors.dialogTitle")}
          description={t("colors.dialogDescription")}
          size="xl"
          className="sm:min-h-[515px]"
          onSubmit={handleCreateSubmit}
          bodyClassName="space-y-3 min-h-[385px]"
          headerAside={
            <AdminLangSwitch
              value={lang}
              onChange={setLang}
              label={tAttr("dialog.langLabel")}
              status={{ en: nameEn.trim() ? undefined : "missing" }}
              className="mt-1"
            />
          }
          footer={
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setIsCreateOpen(false);
                  resetDialogForm();
                }}
                className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}
              >
                {tAttr("cancel")}
              </button>
              <button
                type="submit"
                disabled={isPending || !name.trim() || !effectiveCode}
                className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
              >
                {isPending ? tAttr("processing") : t("colors.submitCreate")}
              </button>
            </>
          }
        >
          {/* Tên & Mã thuộc tính */}
          <div key={lang} role="tabpanel" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <AdminTextField
              autoFocus
              required={lang === "vi"}
              label={tAttr("field.name")}
              value={lang === "vi" ? name : nameEn}
              onValueChange={(next) => {
                if (lang === "vi") {
                  setName(next);
                  setNameError(false);
                } else {
                  setNameEn(next);
                }
              }}
              placeholder={lang === "vi" ? t("colors.namePlaceholder") : t("colors.nameEnPlaceholder")}
              error={lang === "vi" && nameError ? tAttr("groupDialog.nameRequired") : undefined}
            />
            <AdminTextField
              label={tAttr("field.code")}
              hint={tAttr("hints.code")}
              value={effectiveCode}
              onValueChange={(next) => {
                setCodeTouched(true);
                setCode(next.toUpperCase().replace(/[^A-Z0-9_-]/g, ""));
              }}
              placeholder={tAttr("placeholders.code")}
              inputClassName="font-mono"
            />
          </div>

          {/* Mô tả ngắn gọn */}
          <AdminTextField
            label={tAttr("field.description")}
            value={lang === "vi" ? description : descriptionEn}
            onValueChange={(next) => {
              if (lang === "vi") setDescription(next);
              else setDescriptionEn(next);
            }}
            placeholder={
              lang === "vi"
                ? "Mô tả sắc thái hoặc bối cảnh sử dụng (tùy chọn)"
                : "Brief shade notes or usage context (optional)"
            }
          />

          {/* Khối chọn màu sắc chuyên nghiệp của Thiên Canh */}
          <div className="rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-3 space-y-2.5">
            {/* Hàng 1: Tiêu đề + Họ màu nhận diện */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#09090B]">{tAttr("field.colorSection")}</span>
              {effectiveFamily ? (
                <span className="text-2xs text-[#71717A]">
                  {tAttr("field.family")}:{" "}
                  <strong className="font-medium text-[#09090B]">{tAttr(`family.${effectiveFamily}`)}</strong>
                </span>
              ) : null}
            </div>

            {/* Hàng 2: Color Picker + Input HEX + Dải 12 chấm họ màu */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Ô bấm pick màu trực tiếp */}
              <AdminTooltip content={tAttr("field.pickColor")}>
                <label
                  htmlFor="material-color-picker"
                  className="group/picker relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-black/10 shadow-2xs transition-transform hover:scale-105"
                  style={{ background: isValidHex ? hex : "#C0262D" }}
                >
                  <input
                    id="material-color-picker"
                    type="color"
                    value={isValidHex ? hex : "#C0262D"}
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
                  value={hex.replace(/^#/, "")}
                  onChange={(e) =>
                    handleHexChange(`#${e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6)}`.toUpperCase())
                  }
                  placeholder="C0262D"
                  maxLength={6}
                  aria-label={tAttr("field.hex")}
                  className="h-9 w-24 rounded-lg border border-[#E4E4E7] bg-white pl-6 pr-2 font-mono text-xs font-semibold uppercase text-[#09090B] outline-none transition-colors focus:border-[#18181B]"
                />
              </div>

              {/* Dải 12 chấm họ màu tròn */}
              <div
                className="ml-auto flex flex-wrap items-center gap-1.5"
                role="radiogroup"
                aria-label={tAttr("field.family")}
              >
                {COLOR_FAMILIES.map((fam) => {
                  const isSelected = effectiveFamily === fam;
                  return (
                    <AdminTooltip key={fam} content={tAttr(`family.${fam}`)}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={tAttr(`family.${fam}`)}
                        onClick={() => handleSelectFamily(fam)}
                        className={cn(
                          "relative grid size-6 cursor-pointer place-items-center rounded-full transition-transform hover:scale-110",
                          isSelected
                            ? "ring-2 ring-[#18181B] ring-offset-2 scale-105"
                            : "opacity-80 hover:opacity-100"
                        )}
                      >
                        <span
                          className="size-4.5 rounded-full border border-black/15 shadow-2xs"
                          style={{ background: COLOR_FAMILY_HEX[fam] }}
                        />
                      </button>
                    </AdminTooltip>
                  );
                })}
              </div>
            </div>

            {/* Hàng 3: Sắc thái gợi ý theo họ màu đang chọn */}
            <div className="border-t border-[#E4E4E7] pt-2 min-h-[92px]">
              <div className="mb-1.5 flex items-center justify-between text-2xs text-[#71717A]">
                <span>{tAttr("field.colorPresets")}:</span>
                <span className="text-[#A1A1AA]">{tAttr("hints.clickPreset")}</span>
              </div>
              {currentPresets.length > 0 ? (
                <div className="flex max-h-[66px] flex-wrap gap-1.5 overflow-hidden content-start">
                  {currentPresets.slice(0, 8).map((preset) => {
                    const isActive = hex.toUpperCase() === preset.hex.toUpperCase();
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
                  {tAttr("hints.pickColorHint")}
                </div>
              )}
            </div>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}
