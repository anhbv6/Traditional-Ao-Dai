"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminSwitch,
  AdminTextField,
} from "@/features/admin/core/ui";
import { useNotify } from "@/hooks/useNotify";
import { type FabricMaterialOption } from "../../types/fabrics.types";
import { parseMeters } from "../../utils/fabricStock";

interface FabricSpecsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: FabricMaterialOption | undefined;
  isCustomSpecs: boolean;
  customWidthRaw: string;
  customMetersPerTopRaw: string;
  isPending: boolean;
  onSave: (specs: {
    isCustomSpecs: boolean;
    widthCm: number | null;
    metersPerTop: number | null;
    widthRaw: string;
    metersPerTopRaw: string;
  }) => void;
}

/**
 * Dialog điều chỉnh Khổ vải & Định mức riêng cho từng cây vải:
 * - Hiển thị thông số chuẩn theo chất liệu vải gốc
 * - Cho phép bật/tắt thiết lập riêng và nhập khổ vải (cm), định mức (m/áo)
 */
export function FabricSpecsDialog({
  open,
  onOpenChange,
  material,
  isCustomSpecs: initialIsCustomSpecs,
  customWidthRaw: initialCustomWidthRaw,
  customMetersPerTopRaw: initialCustomMetersPerTopRaw,
  isPending,
  onSave,
}: FabricSpecsDialogProps) {
  const t = useTranslations("AdminPage.fabrics");
  const format = useFormatter();
  const notify = useNotify();

  const [tempCustomSpecs, setTempCustomSpecs] = useState(initialIsCustomSpecs);
  const [tempWidthRaw, setTempWidthRaw] = useState(initialCustomWidthRaw);
  const [tempMetersPerTopRaw, setTempMetersPerTopRaw] = useState(initialCustomMetersPerTopRaw);

  const handleSubmit = () => {
    const parsedWidth = tempWidthRaw.trim() ? Number(tempWidthRaw) : null;
    const parsedMetersPerTop = tempMetersPerTopRaw.trim() ? parseMeters(tempMetersPerTopRaw) : null;

    if (
      tempCustomSpecs &&
      parsedWidth !== null &&
      (parsedWidth < 30 || parsedWidth > 400 || !Number.isInteger(parsedWidth))
    ) {
      notify.error(t("rollDialog.errors.customWidth"));
      return;
    }

    if (
      tempCustomSpecs &&
      parsedMetersPerTop !== null &&
      (parsedMetersPerTop <= 0 || parsedMetersPerTop > 20)
    ) {
      notify.error(t("rollDialog.errors.customMetersPerTop"));
      return;
    }

    onSave({
      isCustomSpecs: tempCustomSpecs,
      widthCm: tempCustomSpecs ? parsedWidth : null,
      metersPerTop: tempCustomSpecs ? parsedMetersPerTop : null,
      widthRaw: tempWidthRaw,
      metersPerTopRaw: tempMetersPerTopRaw,
    });
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("rollDialog.customSpecsSwitch")}
      description={t("rollDialog.specsDialog.description")}
      size="md"
    >
      <div className="space-y-4">
        {/* Thông số chuẩn chất liệu dạng dòng thông tin đơn giản */}
        <div className="flex items-center justify-between px-1 text-xs text-[#71717A]">
          <span>{t("rollDialog.specsDialog.standardTitle")}</span>
          <span className="font-mono font-medium text-[#09090B]">
            {material?.widthCm ? `${material.widthCm} cm` : "—"} ·{" "}
            {material?.metersPerTop ? `${format.number(material.metersPerTop)} m/áo` : "—"}
          </span>
        </div>

        {/* Khối Switch bật/tắt thiết lập riêng */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E4E4E7] bg-white p-3.5 shadow-2xs">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#09090B]">{t("rollDialog.customSpecsSwitch")}</p>
            <p className="mt-0.5 text-2xs text-[#71717A]">
              {tempCustomSpecs
                ? t("rollDialog.specsDialog.hintCustom")
                : t("rollDialog.specsDialog.hintStandard")}
            </p>
          </div>
          <AdminSwitch
            checked={tempCustomSpecs}
            onChange={(checked) => {
              setTempCustomSpecs(checked);
              if (checked && !tempWidthRaw && material?.widthCm) {
                setTempWidthRaw(String(material.widthCm));
              }
              if (checked && !tempMetersPerTopRaw && material?.metersPerTop) {
                setTempMetersPerTopRaw(String(material.metersPerTop));
              }
            }}
            label={t("rollDialog.customSpecsSwitch")}
          />
        </div>

        {/* Các trường nhập khi bật switch */}
        {tempCustomSpecs && (
          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <AdminTextField
              label={t("rollDialog.field.customWidth")}
              hint={t("rollDialog.hint.customWidth")}
              value={tempWidthRaw}
              onValueChange={(val) => setTempWidthRaw(val.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder={material?.widthCm ? String(material.widthCm) : t("rollDialog.placeholder.customWidth")}
              inputClassName="font-mono tabular-nums"
            />
            <AdminTextField
              label={t("rollDialog.field.customMetersPerTop")}
              hint={t("rollDialog.hint.customMetersPerTop")}
              value={tempMetersPerTopRaw}
              onValueChange={(val) => setTempMetersPerTopRaw(val.replace(/[^0-9.,]/g, ""))}
              inputMode="decimal"
              placeholder={
                material?.metersPerTop
                  ? String(material.metersPerTop)
                  : t("rollDialog.placeholder.customMetersPerTop")
              }
              inputClassName="font-mono tabular-nums"
            />
          </div>
        )}

        {/* Footer hành động */}
        <div className="flex items-center justify-end gap-2 border-t border-[#F4F4F5] pt-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}
          >
            {t("rollDialog.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {t("rollDialog.save")}
          </button>
        </div>
      </div>
    </AdminDialog>
  );
}
