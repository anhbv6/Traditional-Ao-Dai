"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { MapPin, Phone, User, Plus, Trash2, Edit2, Check } from "lucide-react";
import { useManageAddress } from "../hooks/useProfile";

export function ManageAddressTab() {
  const t = useTranslations("ProfilePage.address");
  const {
    addresses,
    isEditing,
    setIsEditing,
    editingAddress,
    formName,
    setFormName,
    formPhone,
    setFormPhone,
    formProvince,
    setFormProvince,
    formDistrict,
    setFormDistrict,
    formWard,
    setFormWard,
    formDetail,
    setFormDetail,
    formIsDefault,
    setFormIsDefault,
    handleStartAdd,
    handleStartEdit,
    handleDelete,
    handleSetDefault,
    handleSubmit,
  } = useManageAddress();

  return (
    <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between border-b border-[#E2D9D2]/60 pb-5">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020]">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-[#706565]">
            {t("subtitle")}
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleStartAdd}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#800020] px-4 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#800020]/90"
          >
            <Plus size={15} />
            {t("addBtn")}
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Receiver Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
                {t("form.receiverName")}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#706565]/60" />
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 pl-11 pr-4 text-sm text-[#2A2525] outline-none transition-all focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
                />
              </div>
            </div>

            {/* Receiver Phone */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
                {t("form.receiverPhone")}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#706565]/60" />
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 pl-11 pr-4 text-sm text-[#2A2525] outline-none transition-all focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
                />
              </div>
            </div>

            {/* Province */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
                {t("form.province")}
              </label>
              <input
                type="text"
                required
                value={formProvince}
                onChange={(e) => setFormProvince(e.target.value)}
                className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 px-4 text-sm text-[#2A2525] outline-none transition-all focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
              />
            </div>

            {/* District */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
                {t("form.district")}
              </label>
              <input
                type="text"
                required
                value={formDistrict}
                onChange={(e) => setFormDistrict(e.target.value)}
                className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 px-4 text-sm text-[#2A2525] outline-none transition-all focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
              />
            </div>

            {/* Ward */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
                {t("form.ward")}
              </label>
              <input
                type="text"
                required
                value={formWard}
                onChange={(e) => setFormWard(e.target.value)}
                className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 px-4 text-sm text-[#2A2525] outline-none transition-all focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
              />
            </div>

            {/* Detail Address */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
                {t("form.detail")}
              </label>
              <input
                type="text"
                required
                value={formDetail}
                onChange={(e) => setFormDetail(e.target.value)}
                className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 px-4 text-sm text-[#2A2525] outline-none transition-all focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
              />
            </div>
          </div>

          {/* Set Default */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formIsDefault}
              onChange={(e) => setFormIsDefault(e.target.checked)}
              className="size-4 rounded border-[#E2D9D2] text-[#800020] focus:ring-[#800020]"
            />
            <label
              htmlFor="isDefault"
              className="cursor-pointer text-sm text-[#706565]"
            >
              {t("form.isDefault")}
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#E2D9D2] bg-white px-6 text-xs font-semibold uppercase tracking-[1px] text-[#706565] transition-all hover:bg-[#FAF7F5]"
            >
              {t("form.cancelBtn")}
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#800020] px-6 text-xs font-semibold uppercase tracking-[1px] text-white transition-all hover:bg-[#800020]/90"
            >
              {t("form.submitBtn")}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                addr.isDefault
                  ? "border-[#800020]/40 bg-[#FAF7F5]/20"
                  : "border-[#E2D9D2]/70 bg-white"
              }`}
            >
              {/* Receiver Info */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1.5 font-[family-name:var(--font-playfair)] text-base font-semibold text-[#800020]">
                    <User size={15} />
                    {addr.name}
                  </div>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded bg-[#800020]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#800020]">
                      <Check size={11} />
                      {t("default")}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-2 text-sm text-[#706565]">
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="opacity-60" />
                    {addr.phone}
                  </p>
                  <p className="flex items-start gap-2 leading-relaxed">
                    <MapPin size={14} className="mt-0.5 opacity-60 shrink-0" />
                    <span>
                      {addr.detail}, {addr.ward}, {addr.district}, {addr.province}
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 border-t border-[#E2D9D2]/40 pt-4 flex items-center justify-between">
                <div>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-semibold text-[#800020] hover:underline"
                    >
                      {t("setAsDefault")}
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartEdit(addr)}
                    className="inline-flex size-8 items-center justify-center rounded border border-[#E2D9D2] bg-white text-[#706565] hover:border-[#800020] hover:text-[#800020] transition-colors"
                    title={t("edit")}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="inline-flex size-8 items-center justify-center rounded border border-[#E2D9D2] bg-white text-[#706565] hover:border-rose-300 hover:text-rose-600 transition-colors"
                    title={t("delete")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
