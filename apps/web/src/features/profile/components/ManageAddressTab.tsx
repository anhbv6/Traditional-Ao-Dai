"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { MapPin, Phone, User, Plus, Trash2, Edit2, Check, Building2, Navigation, Tag, Home } from "lucide-react";
import { useManageAddress, useVietnamAddress } from "../hooks/useProfile";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FormInput } from "@/components/shared/FormInput";
import { FormSelect } from "@/components/shared/FormSelect";
import {
  Dialog,
  DialogContent as DialogContentUI,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function ManageAddressTab() {
  const t = useTranslations("ProfilePage.address");
  const {
    addresses,
    isLoading,
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
    handleStartAdd,
    handleStartEdit,
    handleDelete,
    handleSetDefault,
    handleSubmit,
    isMutating,
  } = useManageAddress();

  const [deletingId, setDeletingId] = React.useState<string | null>(null);

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
    <div className="rounded-2xl border border-[#800020]/10 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2D9D2]/60 pb-5">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020]">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-[#706565]">
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={handleStartAdd}
          className="w-full sm:w-auto inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#800020] px-4 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#800020]/90 cursor-pointer active:scale-95 duration-200"
        >
          <Plus size={15} />
          {t("addBtn")}
        </button>
      </div>

      {isLoading ? (
        <div className="my-16 flex flex-col items-center justify-center text-center animate-fade-in">
          <span className="w-8 h-8 rounded-full border-2 border-[#800020] border-t-transparent animate-spin" />
          <p className="mt-4 text-[#706565] font-medium">{t("loading")}</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="my-16 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF7F5] text-[#706565]/40 border border-[#E2D9D2]/30">
            <MapPin size={28} />
          </div>
          <p className="mt-4 text-[#706565] font-medium">{t("empty")}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-2xl p-4 sm:p-5.5 transition-all duration-300 flex flex-col justify-between ${
                addr.isDefault
                  ? "border-2 border-[#800020] bg-gradient-to-br from-[#FAF7F5] via-[#FFFDFB] to-[#F5ECE6] shadow-md shadow-[#800020]/10 ring-4 ring-[#800020]/5"
                  : "border border-[#E2D9D2] bg-white shadow-xs hover:border-[#800020]/30 hover:shadow-md"
              }`}
            >
              {/* Receiver Info */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                        addr.isDefault
                          ? "bg-[#800020] text-white shadow-sm shadow-[#800020]/25"
                          : "bg-[#FAF7F5] border border-[#E2D9D2] text-[#706565]"
                      }`}
                    >
                      <User size={14} />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className={`font-[family-name:var(--font-playfair)] text-base sm:text-lg font-bold truncate ${
                          addr.isDefault ? "text-[#800020]" : "text-[#2A2525]"
                        }`}
                      >
                        {addr.receiverName}
                      </h3>
                    </div>
                  </div>

                  <div className="flex gap-1.5 items-center shrink-0">
                    {addr.label && (
                      <span className="inline-flex items-center rounded-full bg-white border border-[#E2D9D2] px-2.5 py-0.5 text-[10px] font-semibold text-[#706565] shadow-2xs">
                        {addr.label}
                      </span>
                    )}
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#800020] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm shadow-[#800020]/20">
                        <Check size={11} className="stroke-[2.5]" />
                        {t("default")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 space-y-2 text-xs sm:text-sm">
                  <p
                    className={`flex items-center gap-2.5 ${
                      addr.isDefault
                        ? "text-[#2A2525] font-medium"
                        : "text-[#706565]"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                        addr.isDefault
                          ? "bg-[#800020]/10 text-[#800020]"
                          : "bg-[#FAF7F5] text-[#706565]/70"
                      }`}
                    >
                      <Phone size={12} />
                    </span>
                    <span>{addr.receiverPhone}</span>
                  </p>
                  <p
                    className={`flex items-start gap-2.5 leading-relaxed ${
                      addr.isDefault
                        ? "text-[#2A2525] font-normal"
                        : "text-[#706565]"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                        addr.isDefault
                          ? "bg-[#800020]/10 text-[#800020]"
                          : "bg-[#FAF7F5] text-[#706565]/70"
                      }`}
                    >
                      <MapPin size={12} />
                    </span>
                    <span>
                      {addr.addressLine}
                      {addr.wardName ? `, ${addr.wardName}` : ""}
                      {addr.districtName ? `, ${addr.districtName}` : ""}
                      {addr.provinceName ? `, ${addr.provinceName}` : ""}
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div
                className={`mt-5 border-t pt-3.5 flex items-center justify-between gap-2 ${
                  addr.isDefault
                    ? "border-[#800020]/15"
                    : "border-[#E2D9D2]/50"
                }`}
              >
                <div>
                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#800020]">
                      <Check size={13} className="stroke-[2.5]" />
                      {t("default")}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-semibold text-[#800020] hover:underline cursor-pointer active:scale-95 duration-200"
                    >
                      {t("setAsDefault")}
                    </button>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleStartEdit(addr)}
                    className={`inline-flex size-9 items-center justify-center rounded-lg border transition-all cursor-pointer active:scale-95 duration-200 ${
                      addr.isDefault
                        ? "border-[#800020]/30 bg-white text-[#800020] hover:bg-[#800020] hover:text-white shadow-2xs"
                        : "border-[#E2D9D2] bg-white text-[#706565] hover:border-[#800020] hover:text-[#800020]"
                    }`}
                    title={t("edit")}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingId(addr.id)}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-[#E2D9D2] bg-white text-[#706565] hover:border-rose-300 hover:text-rose-600 transition-all cursor-pointer active:scale-95 duration-200"
                    title={t("delete")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContentUI
          className="max-w-[92%] sm:max-w-[600px] max-h-[85vh] overflow-hidden gap-0 p-0"
          showCloseButton={true}
        >
          <DialogHeader className="border-b border-[#E2D9D2]/60 bg-[#FAF7F5] px-5 py-4">
            <DialogTitle className="font-[family-name:var(--font-playfair)] text-sm sm:text-base font-bold text-[#800020]">
              {editingAddress ? t("editTitle") : t("addBtn")}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-[#706565]">
              {t("subtitle")}
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 pb-0 space-y-4 overscroll-contain" data-lenis-prevent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
              {/* Receiver Name */}
              <FormInput
                id="receiverName"
                label={t("form.receiverName")}
                startIcon={<User size={15} className="text-[#706565]/60" />}
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("form.placeholderName")}
                className="!h-10 text-xs sm:text-sm"
                containerClassName="space-y-1.5"
                labelClassName="text-[#706565]"
              />

              {/* Receiver Phone */}
              <FormInput
                id="receiverPhone"
                label={t("form.receiverPhone")}
                startIcon={<Phone size={15} className="text-[#706565]/60" />}
                type="tel"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder={t("form.placeholderPhone")}
                className="!h-10 text-xs sm:text-sm"
                containerClassName="space-y-1.5"
                labelClassName="text-[#706565]"
              />

              {/* Province Select */}
              <FormSelect
                id="province"
                label={t("form.province")}
                startIcon={<MapPin size={15} className="text-[#706565]/60" />}
                placeholder={isLoadingProvinces ? t("form.loading") : t("form.placeholderProvince")}
                value={formProvinceName || formProvinceCode}
                onValueChange={handleProvinceChange}
                disabled={isLoadingProvinces}
                options={provinces.map((p) => ({
                  label: p.name,
                  value: p.name,
                }))}
              />

              {/* District Select */}
              <FormSelect
                id="district"
                label={t("form.district")}
                startIcon={<Building2 size={15} className="text-[#706565]/60" />}
                placeholder={isLoadingDistricts ? t("form.loading") : t("form.placeholderDistrict")}
                value={formDistrictName || formDistrictCode}
                onValueChange={handleDistrictChange}
                disabled={(!formProvinceName && !formProvinceCode) || isLoadingDistricts}
                options={districts.map((d) => ({
                  label: d.name,
                  value: d.name,
                }))}
              />

              {/* Ward Select */}
              <FormSelect
                id="ward"
                label={t("form.ward")}
                startIcon={<Navigation size={15} className="text-[#706565]/60" />}
                placeholder={isLoadingWards ? t("form.loading") : t("form.placeholderWard")}
                value={formWardName || formWardCode}
                onValueChange={handleWardChange}
                disabled={(!formDistrictName && !formDistrictCode) || isLoadingWards}
                options={wards.map((w) => ({
                  label: w.name,
                  value: w.name,
                }))}
              />

              {/* Address Label */}
              <FormInput
                id="addressLabel"
                label={t("form.label")}
                startIcon={<Tag size={15} className="text-[#706565]/60" />}
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder={t("form.placeholderLabel")}
                className="!h-10 text-xs sm:text-sm"
                containerClassName="space-y-1.5"
                labelClassName="text-[#706565]"
              />

              {/* Detail Address - full width */}
              <FormInput
                id="addressDetail"
                label={t("form.detail")}
                startIcon={<Home size={15} className="text-[#706565]/60" />}
                type="text"
                required
                value={formAddressLine}
                onChange={(e) => setFormAddressLine(e.target.value)}
                placeholder={t("form.placeholderDetail")}
                className="!h-10 text-xs sm:text-sm"
                containerClassName="space-y-1.5 sm:col-span-2"
                labelClassName="text-[#706565]"
              />
            </div>

            {/* Set Default */}
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="isDefault"
                checked={formIsDefault}
                onCheckedChange={(checked) => setFormIsDefault(!!checked)}
              />
              <label
                htmlFor="isDefault"
                className="cursor-pointer text-xs text-[#706565] select-none"
              >
                {t("form.isDefault")}
              </label>
            </div>

            {/* Address Preview */}
            <div className="pt-1">
              <div className="flex items-center justify-between pb-1.5">
                <span className="font-[family-name:var(--font-lora)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                  {t("form.previewTitle")}
                </span>
              </div>

              <div className="rounded-xl border border-[#E2D9D2] bg-[#FAF7F5]/70 p-3.5 sm:p-4 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-[family-name:var(--font-playfair)] text-sm sm:text-base font-semibold text-[#800020] min-w-0">
                    <User size={14} className="shrink-0 text-[#800020]" />
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

                <div className="mt-2.5 space-y-1.5 text-xs text-[#706565]">
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="shrink-0 text-[#706565]/70" />
                    <span>
                      {formPhone?.trim() || (
                        <span className="text-[#706565]/50 italic">
                          {t("form.placeholderPhone")}
                        </span>
                      )}
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin size={13} className="shrink-0 mt-0.5 text-[#706565]/70" />
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

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-3 border-t border-[#E2D9D2]/40 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full sm:w-auto inline-flex h-9 items-center justify-center rounded-lg border border-[#E2D9D2] bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#706565] transition-all hover:bg-gray-50 cursor-pointer active:scale-95 duration-200"
              >
                {t("form.cancelBtn")}
              </button>
              <button
                type="submit"
                disabled={isMutating || !isFormValid}
                className="w-full sm:w-auto inline-flex h-9 items-center justify-center rounded-lg bg-[#800020] px-5 text-[11px] font-semibold uppercase tracking-[0.5px] text-white transition-all hover:bg-[#800020]/95 cursor-pointer active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMutating ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  t("form.submitBtn")
                )}
              </button>
            </div>
          </form>
        </DialogContentUI>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContentUI
          className="max-w-[92%] sm:max-w-[440px] overflow-hidden gap-0 p-0 rounded-2xl border border-[#800020]/10 shadow-xl"
          showCloseButton={true}
        >
          <DialogHeader className="bg-[#FAF7F5] px-5 py-4">
            <DialogTitle className="font-[family-name:var(--font-playfair)] text-sm sm:text-base font-bold text-[#800020] flex items-center gap-2">
              <Trash2 size={16} className="text-[#800020]" />
              {t("deleteDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-[#706565]">
              {t("deleteDialog.subtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 pt-0">
            <p className="text-xs sm:text-sm text-[#706565] leading-relaxed">
              {t("deleteDialog.message")}
            </p>
          </div>

          <div className="flex pb-0 flex-col sm:flex-row justify-end gap-2.5 px-5 py-3.5 bg-[#FAF7F5]/50 border-t border-[#E2D9D2]/40">
            <button
              type="button"
              onClick={() => setDeletingId(null)}
              className="w-full sm:w-auto inline-flex h-9 items-center justify-center rounded-lg border border-[#E2D9D2] bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#706565] transition-all hover:bg-gray-50 cursor-pointer active:scale-95 duration-200"
            >
              {t("form.cancelBtn")}
            </button>
            <button
              type="button"
              disabled={isMutating}
              onClick={() => {
                if (deletingId) {
                  handleDelete(deletingId);
                  setDeletingId(null);
                }
              }}
              className="w-full sm:w-auto inline-flex h-9 items-center justify-center rounded-lg bg-[#800020] px-5 text-[11px] font-semibold uppercase tracking-[0.5px] text-white transition-all hover:bg-[#800020]/90 cursor-pointer active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMutating ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                t("deleteDialog.confirmBtn")
              )}
            </button>
          </div>
        </DialogContentUI>
      </Dialog>
    </div>
  );
}
