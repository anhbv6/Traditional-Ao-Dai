"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Phone, User, Plus, Trash2, Edit2, Check } from "lucide-react";
import { useManageAddress } from "../../hooks/useProfile";
import { ActionForm, DeleteForm } from "./components";

export function ManageAddressTab() {
  const t = useTranslations("ProfilePage.address");
  const {
    addresses,
    isLoading,
    handleStartAdd,
    handleStartEdit,
    handleSetDefault,
  } = useManageAddress();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-[var(--primary-color)]/10 bg-[var(--bg-card)] p-5 shadow-sm sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)]/60 pb-5">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--primary-ink)]">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-light)]">
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={handleStartAdd}
          className="w-full sm:w-auto inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[var(--primary-color)] px-4 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[var(--primary-color)]/90 cursor-pointer active:scale-95 duration-200"
        >
          <Plus size={15} />
          {t("addBtn")}
        </button>
      </div>

      {isLoading ? (
        <div className="my-16 flex flex-col items-center justify-center text-center animate-fade-in">
          <span className="w-8 h-8 rounded-full border-2 border-[var(--primary-color)] border-t-transparent animate-spin" />
          <p className="mt-4 text-[var(--text-light)] font-medium">{t("loading")}</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="my-16 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-main)] text-[var(--text-light)]/40 border border-[var(--border)]/30">
            <MapPin size={28} />
          </div>
          <p className="mt-4 text-[var(--text-light)] font-medium">{t("empty")}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-2xl p-4 sm:p-5.5 transition-all duration-300 flex flex-col justify-between ${
                addr.isDefault
                  ? "border-2 border-[var(--primary-color)] bg-gradient-to-br from-[var(--bg-main)] via-[var(--bg-card)] to-[var(--bg-secondary)] shadow-md shadow-[var(--primary-color)]/10 ring-4 ring-[var(--primary-color)]/5"
                  : "border border-[var(--border)] bg-[var(--bg-card)] shadow-xs hover:border-[var(--primary-color)]/30 hover:shadow-md"
              }`}
            >
              {/* Receiver Info */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                        addr.isDefault
                          ? "bg-[var(--primary-color)] text-white shadow-sm shadow-[var(--primary-color)]/25"
                          : "bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-light)]"
                      }`}
                    >
                      <User size={14} />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className={`font-[family-name:var(--font-playfair)] text-base sm:text-lg font-bold truncate ${
                          addr.isDefault ? "text-[var(--primary-ink)]" : "text-[var(--text-main)]"
                        }`}
                      >
                        {addr.receiverName}
                      </h3>
                    </div>
                  </div>

                  <div className="flex gap-1.5 items-center shrink-0">
                    {addr.label && (
                      <span className="inline-flex items-center rounded-full bg-[var(--bg-card)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--text-light)] shadow-2xs">
                        {addr.label}
                      </span>
                    )}
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-color)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm shadow-[var(--primary-color)]/20">
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
                        ? "text-[var(--text-main)] font-medium"
                        : "text-[var(--text-light)]"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                        addr.isDefault
                          ? "bg-[var(--primary-color)]/10 text-[var(--primary-ink)]"
                          : "bg-[var(--bg-main)] text-[var(--text-light)]/70"
                      }`}
                    >
                      <Phone size={12} />
                    </span>
                    <span>{addr.receiverPhone}</span>
                  </p>
                  <p
                    className={`flex items-start gap-2.5 leading-relaxed ${
                      addr.isDefault
                        ? "text-[var(--text-main)] font-normal"
                        : "text-[var(--text-light)]"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                        addr.isDefault
                          ? "bg-[var(--primary-color)]/10 text-[var(--primary-ink)]"
                          : "bg-[var(--bg-main)] text-[var(--text-light)]/70"
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
                    ? "border-[var(--primary-color)]/15"
                    : "border-[var(--border)]/50"
                }`}
              >
                <div>
                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary-ink)]">
                      <Check size={13} className="stroke-[2.5]" />
                      {t("default")}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-semibold text-[var(--primary-ink)] hover:underline cursor-pointer active:scale-95 duration-200"
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
                        ? "border-[var(--primary-color)]/30 bg-[var(--bg-card)] text-[var(--primary-ink)] hover:bg-[var(--primary-color)] hover:text-white shadow-2xs"
                        : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-light)] hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
                    }`}
                    title={t("edit")}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingId(addr.id)}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-light)] hover:border-rose-300 hover:text-rose-600 transition-all cursor-pointer active:scale-95 duration-200"
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
      <ActionForm />

      {/* Delete Confirmation Dialog */}
      <DeleteForm 
        deletingId={deletingId}
        setDeletingId={setDeletingId}
      />
    </div>
  );
}
