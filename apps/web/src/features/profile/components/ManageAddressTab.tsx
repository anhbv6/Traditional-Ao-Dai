"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { MapPin, Phone, User, Plus, Trash2, Edit2, Check } from "lucide-react";
import { useManageAddress } from "../hooks/useProfile";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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
    formDistrictName,
    setFormDistrictName,
    formWardName,
    setFormWardName,
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
          <p className="mt-4 text-[#706565] font-medium">Đang tải danh sách địa chỉ...</p>
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
              className={`relative rounded-xl border p-4 sm:p-5 shadow-sm transition-all duration-300 flex flex-col justify-between hover:shadow-md ${
                addr.isDefault
                  ? "border-[#800020]/40 bg-[#FAF7F5]/20"
                  : "border-[#E2D9D2]/70 bg-white"
              }`}
            >
              {/* Receiver Info */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1.5 font-[family-name:var(--font-playfair)] text-base font-semibold text-[#800020] min-w-0">
                    <User size={15} className="shrink-0" />
                    <span className="truncate">{addr.receiverName}</span>
                  </div>
                  <div className="flex gap-1.5 items-center shrink-0">
                    {addr.label && (
                      <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-[#706565]">
                        {addr.label}
                      </span>
                    )}
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded bg-[#800020]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#800020]">
                        <Check size={11} />
                        {t("default")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-sm text-[#706565]">
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="opacity-60 shrink-0" />
                    {addr.receiverPhone}
                  </p>
                  <p className="flex items-start gap-2 leading-relaxed">
                    <MapPin size={14} className="mt-0.5 opacity-60 shrink-0" />
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
              <div className="mt-5 border-t border-[#E2D9D2]/40 pt-4 flex items-center justify-between gap-2">
                <div>
                  {!addr.isDefault && (
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
                    className="inline-flex size-9 items-center justify-center rounded border border-[#E2D9D2] bg-white text-[#706565] hover:border-[#800020] hover:text-[#800020] transition-colors cursor-pointer active:scale-95 duration-200"
                    title={t("edit")}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="inline-flex size-9 items-center justify-center rounded border border-[#E2D9D2] bg-white text-[#706565] hover:border-rose-300 hover:text-rose-600 transition-colors cursor-pointer active:scale-95 duration-200"
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
        <DialogContent
          className="max-w-[80%] sm:max-w-[420px] max-h-[85vh] overflow-hidden gap-0 p-0"
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-row items-center gap-4">
                {/* Receiver Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                    {t("form.receiverName")}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#706565]/60 z-10" />
                    <Input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t("form.placeholderName")}
                      className="pl-9 h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Receiver Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                    {t("form.receiverPhone")}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#706565]/60 z-10" />
                    <Input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder={t("form.placeholderPhone")}
                      className="pl-9 h-10 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Province */}
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                  {t("form.province")}
                </label>
                <Input
                  type="text"
                  required
                  value={formProvinceName}
                  onChange={(e) => setFormProvinceName(e.target.value)}
                  placeholder={t("form.placeholderProvince")}
                  className="h-10 text-xs"
                />
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                  {t("form.district")}
                </label>
                <Input
                  type="text"
                  required
                  value={formDistrictName}
                  onChange={(e) => setFormDistrictName(e.target.value)}
                  placeholder={t("form.placeholderDistrict")}
                  className="h-10 text-xs"
                />
              </div>

              {/* Ward */}
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                  {t("form.ward")}
                </label>
                <Input
                  type="text"
                  required
                  value={formWardName}
                  onChange={(e) => setFormWardName(e.target.value)}
                  placeholder={t("form.placeholderWard")}
                  className="h-10 text-xs"
                />
              </div>

              {/* Detail Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                  {t("form.detail")}
                </label>
                <Input
                  type="text"
                  required
                  value={formAddressLine}
                  onChange={(e) => setFormAddressLine(e.target.value)}
                  placeholder={t("form.placeholderDetail")}
                  className="h-10 text-xs"
                />
              </div>

              {/* Address Label */}
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                  {t("form.label")}
                </label>
                <Input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder={t("form.placeholderLabel")}
                  className="h-10 text-xs"
                />
              </div>
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
                disabled={isMutating}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
