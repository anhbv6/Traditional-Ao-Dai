"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { FormInput } from "@/components/shared/FormInput";
import { PopupDialog } from "@/components/shared/PopupDialog";
import { Building2, Check, Home, MapPin, Navigation, Phone, Tag, User } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAddressForm, useVietnamAddress } from "../../../hooks/useProfile";

const LABEL_CLASS =
  "block font-[family-name:var(--font-lora)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]";

const INPUT_CLASS =
  "!h-9 sm:!h-10 text-sm leading-[1.15] sm:leading-normal text-[#2A2525] bg-white border border-[#E2D9D2] rounded-lg focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/20 hover:border-[#800020]/30 transition-colors placeholder:text-[#706565]/50 placeholder:text-[11px] sm:placeholder:text-xs !pl-8 sm:!pl-9 !pr-3";

const SELECT_TRIGGER_CLASS =
  "!w-full !h-9 sm:!h-10 !rounded-lg border border-[#E2D9D2] bg-white text-xs sm:text-sm leading-[1.15] sm:leading-normal text-[#2A2525] outline-none transition-colors focus:border-[#800020] focus:bg-white focus:ring-2 focus:ring-[#800020]/20 hover:border-[#800020]/30 shadow-none cursor-pointer disabled:opacity-50 !pl-8 sm:!pl-9 !pr-3 data-placeholder:text-[#706565]/50 data-placeholder:text-[11px] sm:data-placeholder:text-xs";

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
    formWardCode,
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

  const {
    provinces,
    districts,
    wards,
    isLoadingProvinces,
    isLoadingDistricts,
    isLoadingWards,
  } = useVietnamAddress(formProvinceName || formProvinceCode, formDistrictName || formDistrictCode);

  // ─── Cascading handlers ─────────────────────────────────────────────────────
  const handleProvinceChange = (value: string | null) => {
    if (!value) return;
    const province = provinces.find((p) => p.name === value || String(p.code) === value);
    if (province) {
      setFormProvinceCode(String(province.code));
      setFormProvinceName(province.name);
    } else {
      setFormProvinceName(value);
      setFormProvinceCode("");
    }
    // Reset district & ward
    setFormDistrictCode("");
    setFormDistrictName("");
    setFormWardCode("");
    setFormWardName("");
  };

  const handleDistrictChange = (value: string | null) => {
    if (!value) return;
    const district = districts.find((d) => d.name === value || String(d.code) === value);
    if (district) {
      setFormDistrictCode(String(district.code));
      setFormDistrictName(district.name);
    } else {
      setFormDistrictName(value);
      setFormDistrictCode("");
    }
    // Reset ward
    setFormWardCode("");
    setFormWardName("");
  };

  const handleWardChange = (value: string | null) => {
    if (!value) return;
    const ward = wards.find((w) => w.name === value || String(w.code) === value);
    if (ward) {
      setFormWardCode(String(ward.code));
      setFormWardName(ward.name);
    } else {
      setFormWardName(value);
      setFormWardCode("");
    }
  };

  const isFormValid =
    Boolean(formName?.trim()) &&
    Boolean(formPhone?.trim()) &&
    Boolean(formProvinceName || formProvinceCode) &&
    Boolean(formDistrictName || formDistrictCode) &&
    Boolean(formWardName || formWardCode) &&
    Boolean(formAddressLine?.trim());

  return (
    <PopupDialog
      open={isEditing}
      onOpenChange={setIsEditing}
      title={
        <span className="font-[family-name:var(--font-playfair)] text-base sm:text-lg font-bold text-[#800020] block">
          {editingAddress ? t("editTitle") : t("addBtn")}
        </span>
      }
      description={
        <span className="text-[11px] sm:text-xs text-[#706565] block">
          {t("subtitle")}
        </span>
      }
      size="xl"
      scrollable
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2.5 w-full pt-1.5 sm:pt-2 border-t border-[#E2D9D2]/60">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="w-full sm:w-auto inline-flex h-8 sm:h-9 items-center justify-center rounded-lg border border-[#E2D9D2] bg-white px-4 sm:px-5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.5px] text-[#706565] transition-all hover:bg-gray-50 cursor-pointer active:scale-95 duration-200"
          >
            {t("form.cancelBtn")}
          </button>
          <button
            type="submit"
            form="address-action-form"
            disabled={isMutating || !isFormValid}
            className="w-full sm:w-auto inline-flex h-8 sm:h-9 items-center justify-center rounded-lg bg-[#800020] px-4 sm:px-5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.5px] text-white transition-all hover:bg-[#800020]/90 cursor-pointer active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMutating ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              t("form.submitBtn")
            )}
          </button>
        </div>
      }
    >
      <form id="address-action-form" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pt-1" data-lenis-prevent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3.5 gap-y-2.5 sm:gap-x-4 sm:gap-y-3.5">
          {/* Receiver Name */}
          <FormInput
            id="receiverName"
            label={t("form.receiverName")}
            startIcon={<User size={14} className="text-[#706565]/60" />}
            type="text"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder={t("form.placeholderName")}
            className={INPUT_CLASS}
            containerClassName="space-y-1"
            labelClassName={LABEL_CLASS}
          />

          {/* Receiver Phone */}
          <FormInput
            id="receiverPhone"
            label={t("form.receiverPhone")}
            startIcon={<Phone size={14} className="text-[#706565]/60" />}
            type="tel"
            required
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder={t("form.placeholderPhone")}
            className={INPUT_CLASS}
            containerClassName="space-y-1"
            labelClassName={LABEL_CLASS}
          />

          {/* Province Select */}
          <div className="space-y-1 flex flex-col">
            <label htmlFor="province" className={LABEL_CLASS}>
              {t("form.province")}
            </label>
            <div className="relative w-full">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center text-[#706565]/60 z-10 pointer-events-none">
                <MapPin size={14} />
              </div>
              <Select
                value={formProvinceName || formProvinceCode || undefined}
                onValueChange={handleProvinceChange}
                disabled={isLoadingProvinces}
              >
                <SelectTrigger
                  id="province"
                  className={SELECT_TRIGGER_CLASS}
                >
                  <SelectValue placeholder={isLoadingProvinces ? t("form.loading") : t("form.placeholderProvince")} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#E2D9D2] text-[#2A2525] shadow-lg rounded-xl overflow-hidden font-medium z-[100] max-h-60 overscroll-contain">
                  {provinces.map((p) => (
                    <SelectItem
                      key={p.code || p.name}
                      value={p.name}
                      className="cursor-pointer text-xs sm:text-sm font-medium data-[highlighted]:bg-[#800020]/10 data-[highlighted]:text-[#800020] data-[selected]:bg-[#800020] data-[selected]:text-white"
                    >
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* District Select */}
          <div className="space-y-1 flex flex-col">
            <label htmlFor="district" className={LABEL_CLASS}>
              {t("form.district")}
            </label>
            <div className="relative w-full">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center text-[#706565]/60 z-10 pointer-events-none">
                <Building2 size={14} />
              </div>
              <Select
                value={formDistrictName || formDistrictCode || undefined}
                onValueChange={handleDistrictChange}
                disabled={(!formProvinceName && !formProvinceCode) || isLoadingDistricts}
              >
                <SelectTrigger
                  id="district"
                  className={SELECT_TRIGGER_CLASS}
                >
                  <SelectValue placeholder={isLoadingDistricts ? t("form.loading") : t("form.placeholderDistrict")} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#E2D9D2] text-[#2A2525] shadow-lg rounded-xl overflow-hidden font-medium z-[100] max-h-60 overscroll-contain">
                  {districts.map((d) => (
                    <SelectItem
                      key={d.code || d.name}
                      value={d.name}
                      className="cursor-pointer text-xs sm:text-sm font-medium data-[highlighted]:bg-[#800020]/10 data-[highlighted]:text-[#800020] data-[selected]:bg-[#800020] data-[selected]:text-white"
                    >
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ward Select */}
          <div className="space-y-1 flex flex-col">
            <label htmlFor="ward" className={LABEL_CLASS}>
              {t("form.ward")}
            </label>
            <div className="relative w-full">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center text-[#706565]/60 z-10 pointer-events-none">
                <Navigation size={14} />
              </div>
              <Select
                value={formWardName || formWardCode || undefined}
                onValueChange={handleWardChange}
                disabled={(!formDistrictName && !formDistrictCode) || isLoadingWards}
              >
                <SelectTrigger
                  id="ward"
                  className={SELECT_TRIGGER_CLASS}
                >
                  <SelectValue placeholder={isLoadingWards ? t("form.loading") : t("form.placeholderWard")} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#E2D9D2] text-[#2A2525] shadow-lg rounded-xl overflow-hidden font-medium z-[100] max-h-60 overscroll-contain">
                  {wards.map((w) => (
                    <SelectItem
                      key={w.code || w.name}
                      value={w.name}
                      className="cursor-pointer text-xs sm:text-sm font-medium data-[highlighted]:bg-[#800020]/10 data-[highlighted]:text-[#800020] data-[selected]:bg-[#800020] data-[selected]:text-white"
                    >
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address Label */}
          <FormInput
            id="addressLabel"
            label={t("form.label")}
            startIcon={<Tag size={14} className="text-[#706565]/60" />}
            type="text"
            value={formLabel}
            onChange={(e) => setFormLabel(e.target.value)}
            placeholder={t("form.placeholderLabel")}
            className={INPUT_CLASS}
            containerClassName="space-y-1"
            labelClassName={LABEL_CLASS}
          />

          {/* Detail Address - full width */}
          <FormInput
            id="addressDetail"
            label={t("form.detail")}
            startIcon={<Home size={14} className="text-[#706565]/60" />}
            type="text"
            required
            value={formAddressLine}
            onChange={(e) => setFormAddressLine(e.target.value)}
            placeholder={t("form.placeholderDetail")}
            className={INPUT_CLASS}
            containerClassName="space-y-1 sm:col-span-2"
            labelClassName={LABEL_CLASS}
          />
        </div>

        {/* Set Default */}
        <div className="flex items-center gap-2 pt-0.5">
          <Checkbox
            id="isDefault"
            checked={formIsDefault}
            onCheckedChange={(checked) => setFormIsDefault(!!checked)}
          />
          <label
            htmlFor="isDefault"
            className="cursor-pointer text-xs sm:text-sm font-medium text-[#706565] select-none"
          >
            {t("form.isDefault")}
          </label>
        </div>

        {/* Address Preview */}
        <div className="pt-0.5">
          <div className="flex items-center justify-between pb-1">
            <span className={LABEL_CLASS}>
              {t("form.previewTitle")}
            </span>
          </div>

          <div className="rounded-xl border border-[#E2D9D2] bg-[#FAF7F5]/70 p-3 sm:p-4 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 font-[family-name:var(--font-playfair)] text-sm sm:text-base font-bold text-[#800020] min-w-0">
                <User size={13} className="shrink-0 text-[#800020]" />
                <span className="truncate">
                  {formName?.trim() || (
                    <span className="text-[#706565]/50 italic text-xs sm:text-sm font-normal">
                      {t("form.placeholderName")}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-1.5 items-center shrink-0">
                {formLabel?.trim() && (
                  <span className="inline-flex items-center rounded bg-white border border-[#E2D9D2] px-2 py-0.5 text-[10px] font-semibold text-[#706565]">
                    {formLabel.trim()}
                  </span>
                )}
                {formIsDefault && (
                  <span className="inline-flex items-center gap-1 rounded bg-[#800020]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#800020]">
                    <Check size={11} />
                    {t("default")}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 space-y-1 text-xs text-[#706565]">
              <p className="flex items-center gap-2">
                <Phone size={12} className="shrink-0 text-[#706565]/70" />
                <span>
                  {formPhone?.trim() || (
                    <span className="text-[#706565]/50 italic">
                      {t("form.placeholderPhone")}
                    </span>
                  )}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin size={12} className="shrink-0 mt-0.5 text-[#706565]/70" />
                <span className="leading-relaxed">
                  {[
                    formAddressLine?.trim(),
                    formWardName?.trim(),
                    formDistrictName?.trim(),
                    formProvinceName?.trim(),
                  ]
                    .filter(Boolean)
                    .join(", ") || (
                    <span className="text-[#706565]/50 italic">
                      {t("form.placeholderDetail")}
                    </span>
                  )}
                </span>
              </p>
            </div>
          </div>
        </div>
      </form>
    </PopupDialog>
  );
}

export default ActionForm;
