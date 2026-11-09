"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import { useTranslations } from "next-intl";
import { ORDER_MEASUREMENT_KEYS, type OrderMeasurementKey } from "@repo/shared/orders";
import { AppDialog } from "@/components/shared/AppDialog";
import { TextAreaField } from "@/components/shared/TextAreaField";
import { TextField } from "@/components/shared/TextField";
import { cn } from "@/lib/utils";
import { MEASUREMENT_RANGES, MEASUREMENT_NOTE_MAX, PROFILE_NAME_MAX } from "../../constants/measurements";
import { type MeasurementProfile, type MeasurementProfileInput } from "../../types/profile.types";

const FORM_ID = "measurement-profile-form";

interface MeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Bộ đang sửa — bỏ trống là thêm mới */
  profile?: MeasurementProfile | null;
  /** Chưa có bộ nào → bộ đầu tiên luôn là mặc định */
  isFirst: boolean;
  onSave: (input: MeasurementProfileInput) => void;
}

type FieldErrors = Partial<Record<OrderMeasurementKey | "profileName" | "values", string>>;

/**
 * Hộp thoại thêm / sửa một bộ số đo: tên (bắt buộc) → lưới 12 số đo có đơn vị → ghi chú form dáng → đặt mặc định.
 * Ô trống được bỏ qua; ô có giá trị phải nằm trong khoảng hợp lý (MEASUREMENT_RANGES). Cần ít nhất một số đo.
 * Cha gắn `key` theo bộ đang sửa để mỗi lần mở là form mới với giá trị đúng.
 */
export function MeasurementDialog({ open, onOpenChange, profile, isFirst, onSave }: MeasurementDialogProps) {
  const t = useTranslations("ProfilePage.measurements");
  const tLabel = useTranslations("OrdersPage.measurement");

  const [profileName, setProfileName] = useState(profile?.profileName ?? "");
  const [note, setNote] = useState(profile?.note ?? "");
  const [isDefault, setIsDefault] = useState(profile?.isDefault ?? isFirst);
  const [values, setValues] = useState<Partial<Record<OrderMeasurementKey, string>>>(() =>
    Object.fromEntries(Object.entries(profile?.values ?? {}).map(([key, value]) => [key, String(value)])),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitCount, setSubmitCount] = useState(0);

  const clearError = (field: keyof FieldErrors) =>
    setErrors((prev) => (prev[field] || prev.values ? { ...prev, [field]: undefined, values: undefined } : prev));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitCount((count) => count + 1);

    const nextErrors: FieldErrors = {};
    const parsed: Partial<Record<OrderMeasurementKey, number>> = {};
    if (!profileName.trim()) nextErrors.profileName = t("errors.nameRequired");

    for (const key of ORDER_MEASUREMENT_KEYS) {
      const raw = values[key]?.trim().replace(",", ".");
      if (!raw) continue;
      const value = Number(raw);
      const { min, max } = MEASUREMENT_RANGES[key];
      if (!Number.isFinite(value) || value < min || value > max) {
        nextErrors[key] = t("errors.range", { min, max });
      } else {
        parsed[key] = Math.round(value * 10) / 10;
      }
    }
    if (Object.keys(parsed).length === 0 && !Object.keys(nextErrors).some((key) => key !== "profileName")) {
      nextErrors.values = t("errors.valuesRequired");
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({ profileName: profileName.trim(), note: note.trim() || undefined, isDefault: isDefault || isFirst, values: parsed });
    onOpenChange(false);
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Ruler}
      title={profile ? t("editTitle") : t("addTitle")}
      description={t("dialogDesc")}
      size="lg"
      confirm={{ label: t("save"), form: FORM_ID }}
      cancel={{ label: t("cancel") }}
    >
      <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="space-y-6">
        <TextField
          appearance="outline"
          size="md"
          required
          label={t("nameLabel")}
          placeholder={t("namePlaceholder")}
          maxLength={PROFILE_NAME_MAX}
          value={profileName}
          onValueChange={(value) => {
            setProfileName(value);
            clearError("profileName");
          }}
          error={errors.profileName}
          shakeKey={submitCount}
        />

        <fieldset>
          <legend className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]">{t("valuesLabel")}</legend>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            {ORDER_MEASUREMENT_KEYS.map((key) => (
              <TextField
                key={key}
                appearance="outline"
                size="sm"
                label={tLabel(key)}
                inputMode="decimal"
                placeholder={String(MEASUREMENT_RANGES[key].placeholder)}
                suffix={MEASUREMENT_RANGES[key].unit}
                value={values[key] ?? ""}
                onValueChange={(value) => {
                  setValues((prev) => ({ ...prev, [key]: value }));
                  clearError(key);
                }}
                error={errors[key]}
                shakeKey={submitCount}
              />
            ))}
          </div>
          {errors.values ? (
            <p key={`values-${submitCount}`} role="alert" className="mt-3 text-xs text-[var(--destructive)] motion-safe:animate-shake">
              {errors.values}
            </p>
          ) : null}
        </fieldset>

        <TextAreaField
          label={t("noteLabel")}
          placeholder={t("notePlaceholder")}
          rows={2}
          autoResize
          maxLength={MEASUREMENT_NOTE_MAX}
          showCount
          value={note}
          onValueChange={setNote}
        />

        <label className={cn("flex items-center gap-3 text-sm", isFirst ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
          <input
            type="checkbox"
            checked={isDefault || isFirst}
            disabled={isFirst}
            onChange={(event) => setIsDefault(event.target.checked)}
            className="size-4 accent-[var(--primary-color)]"
          />
          {t("setDefaultLabel")}
        </label>
      </form>
    </AppDialog>
  );
}
