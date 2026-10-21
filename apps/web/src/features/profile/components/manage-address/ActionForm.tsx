"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, Home, MapPin, Navigation, Phone, Save, Tag, UserRound } from "lucide-react";
import { VIETNAM_PHONE_REGEX } from "@repo/shared/validation";
import { Checkbox } from "@/components/ui/checkbox";
import { ActionButton } from "@/components/shared/ActionButton";
import { AppDialog } from "@/components/shared/AppDialog";
import { SelectField } from "@/components/shared/SelectField";
import { TextField } from "@/components/shared/TextField";
import { useAddressForm, useVietnamAddress } from "../../hooks/useProfile";

const FORM_ID = "address-action-form";

type FieldKey = "name" | "phone" | "province" | "district" | "ward" | "detail";

/**
 * Hộp thoại thêm / sửa địa chỉ: TextField + SelectField chung (Tỉnh → Quận → Phường chọn lần lượt),
 * kiểm tra bắt buộc + định dạng SĐT khi bấm Lưu, lỗi hiện ngay dưới từng ô.
 */
export function ActionForm() {
  const t = useTranslations("ProfilePage.address");
  const {
    isEditing,
    setIsEditing,
    editingAddress,
    formName,
    setFormName,
    formPhone,
    setFormPhone,
    formProvinceName,
    setFormProvinceName,
    formProvinceCode,
    setFormProvinceCode,
    formDistrictName,
    setFormDistrictName,
    formDistrictCode,
    setFormDistrictCode,
    formWardName,
    setFormWardName,
    setFormWardCode,
    formAddressLine,
    setFormAddressLine,
    formLabel,
    setFormLabel,
    formIsDefault,
    setFormIsDefault,
    handleSubmit,
    isMutating,
  } = useAddressForm();

  const { provinces, districts, wards, isLoadingProvinces, isLoadingDistricts, isLoadingWards } = useVietnamAddress(
    formProvinceName || formProvinceCode,
    formDistrictName || formDistrictCode,
  );

  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitCount, setSubmitCount] = useState(0);
  const clearError = (key: FieldKey) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleProvinceChange = (value: string) => {
    const province = provinces.find((p) => p.name === value);
    setFormProvinceName(value);
    setFormProvinceCode(province ? String(province.code) : "");
    // Đổi tỉnh → xoá quận / phường đã chọn
    setFormDistrictCode("");
    setFormDistrictName("");
    setFormWardCode("");
    setFormWardName("");
    clearError("province");
  };

  const handleDistrictChange = (value: string) => {
    const district = districts.find((d) => d.name === value);
    setFormDistrictName(value);
    setFormDistrictCode(district ? String(district.code) : "");
    setFormWardCode("");
    setFormWardName("");
    clearError("district");
  };

  const handleWardChange = (value: string) => {
    const ward = wards.find((w) => w.name === value);
    setFormWardName(value);
    setFormWardCode(ward ? String(ward.code) : "");
    clearError("ward");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitCount((count) => count + 1);
    const required = t("requiredField");
    const phone = formPhone.trim();
    const nextErrors: Partial<Record<FieldKey, string>> = {
      name: formName.trim() ? undefined : required,
      phone: !phone ? required : VIETNAM_PHONE_REGEX.test(phone) ? undefined : t("phoneInvalid"),
      province: formProvinceName ? undefined : required,
      district: formDistrictName ? undefined : required,
      ward: formWardName ? undefined : required,
      detail: formAddressLine.trim() ? undefined : required,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    handleSubmit(e);
  };

  const close = (open: boolean) => {
    if (open) return;
    setIsEditing(false);
    setErrors({});
  };

  const toOptions = (items: { name: string }[]) => items.map((item) => ({ value: item.name, label: item.name }));

  return (
    <AppDialog
      open={isEditing}
      onOpenChange={close}
      icon={MapPin}
      title={editingAddress ? t("editTitle") : t("addBtn")}
      description={t("subtitle")}
      size="lg"
      dismissible={!isMutating}
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ActionButton variant="cancel" onClick={() => close(false)} disabled={isMutating}>
            {t("form.cancelBtn")}
          </ActionButton>
          <ActionButton type="submit" form={FORM_ID} variant="confirm" icon={<Save />} loading={isMutating}>
            {t("form.submitBtn")}
          </ActionButton>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            appearance="outline"
            size="md"
            label={t("form.receiverName")}
            required
            prefix={<UserRound />}
            autoComplete="name"
            placeholder={t("form.placeholderName")}
            value={formName}
            onValueChange={(value) => {
              setFormName(value);
              clearError("name");
            }}
            error={errors.name}
            shakeKey={submitCount}
          />
          <TextField
            appearance="outline"
            size="md"
            type="tel"
            label={t("form.receiverPhone")}
            required
            prefix={<Phone />}
            autoComplete="tel"
            placeholder={t("form.placeholderPhone")}
            value={formPhone}
            onValueChange={(value) => {
              setFormPhone(value.replace(/[^\d+]/g, ""));
              clearError("phone");
            }}
            error={errors.phone}
            shakeKey={submitCount}
          />

          <SelectField
            label={t("form.province")}
            required
            prefix={<MapPin />}
            placeholder={t("form.placeholderProvince")}
            options={toOptions(provinces)}
            value={formProvinceName || null}
            onValueChange={handleProvinceChange}
            loading={isLoadingProvinces}
            error={errors.province}
          />
          <SelectField
            label={t("form.district")}
            required
            prefix={<Building2 />}
            placeholder={t("form.placeholderDistrict")}
            options={toOptions(districts)}
            value={formDistrictName || null}
            onValueChange={handleDistrictChange}
            loading={isLoadingDistricts}
            disabled={!formProvinceName}
            error={errors.district}
          />
          <SelectField
            label={t("form.ward")}
            required
            prefix={<Navigation />}
            placeholder={t("form.placeholderWard")}
            options={toOptions(wards)}
            value={formWardName || null}
            onValueChange={handleWardChange}
            loading={isLoadingWards}
            disabled={!formDistrictName}
            error={errors.ward}
          />
          <TextField
            appearance="outline"
            size="md"
            label={t("form.label")}
            prefix={<Tag />}
            placeholder={t("form.placeholderLabel")}
            maxLength={30}
            value={formLabel}
            onValueChange={setFormLabel}
          />
          <TextField
            appearance="outline"
            size="md"
            label={t("form.detail")}
            required
            prefix={<Home />}
            autoComplete="street-address"
            placeholder={t("form.placeholderDetail")}
            value={formAddressLine}
            onValueChange={(value) => {
              setFormAddressLine(value);
              clearError("detail");
            }}
            error={errors.detail}
            shakeKey={submitCount}
            className="sm:col-span-2"
          />
        </div>

        <label htmlFor="isDefault" className="flex w-fit cursor-pointer items-center gap-2.5 text-[13px] text-[var(--text-main)] select-none">
          <Checkbox id="isDefault" checked={formIsDefault} onCheckedChange={(checked) => setFormIsDefault(checked === true)} />
          {t("form.isDefault")}
        </label>
      </form>
    </AppDialog>
  );
}

export default ActionForm;
