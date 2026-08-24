"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Plus, Trash2, Check, Sparkles } from "lucide-react";
import { useManagePayment } from "../../hooks/useProfile";
import { type PaymentCard } from "../../types/profile.types";
import { Input } from "@/components/ui/input";

export function ManagePaymentTab() {
  const t = useTranslations("ProfilePage.payment");
  const {
    cards,
    isAdding,
    setIsAdding,
    holder,
    setHolder,
    number,
    setNumber,
    expiry,
    setExpiry,
    cvv,
    setCvv,
    handleStartAdd,
    handleDelete,
    handleSetDefault,
    handleSubmit,
  } = useManagePayment();

  const getCardBg = (type: PaymentCard["type"]) => {
    if (type === "visa") {
      return "bg-gradient-to-br from-[#1a1c24] via-[#2d3142] to-[#121319] text-white";
    }
    return "bg-gradient-to-br from-[#800020] via-[#5c0017] to-[#3a000e] text-white";
  };

  return (
    <div className="rounded-2xl border border-[#800020]/10 bg-white p-5 shadow-sm sm:p-8 animate-fade-in">
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

      {cards.length === 0 ? (
        <div className="my-16 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF7F5] text-[#706565]/40 border border-[#E2D9D2]/30">
            <CreditCard size={28} />
          </div>
          <p className="mt-4 text-[#706565] font-medium">{t("empty")}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`relative rounded-2xl border p-4 sm:p-6 flex flex-col justify-between min-h-[190px] sm:min-h-[200px] overflow-hidden shadow-md select-none transition-all hover:shadow-lg ${getCardBg(
                card.type
              )}`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[8px] sm:text-[10px] uppercase tracking-[1.5px] sm:tracking-[2px] opacity-75 font-semibold">
                    {card.type === "visa" ? "Visa Signature" : "Mastercard World"}
                  </p>
                  {card.isDefault && (
                    <span className="mt-1 inline-flex items-center gap-0.5 rounded bg-white/20 px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">
                      <Check size={9} />
                      {t("default")}
                    </span>
                  )}
                </div>
                <div className="font-[family-name:var(--font-playfair)] text-base sm:text-xl italic font-bold">
                  {card.type === "visa" ? "Visa" : "Mastercard"}
                </div>
              </div>

              {/* Card Number */}
              <div className="mt-4 sm:mt-6 text-base tracking-[3px] sm:text-xl sm:tracking-[4px] font-medium font-mono text-center">
                {card.number}
              </div>

              {/* Card Footer */}
              <div className="mt-4 sm:mt-6 flex items-end justify-between">
                <div>
                  <p className="text-[8px] sm:text-[9px] uppercase tracking-wider opacity-60">
                    Cardholder
                  </p>
                  <p className="text-xs sm:text-sm font-semibold tracking-wider">
                    {card.holder}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] sm:text-[9px] uppercase tracking-wider opacity-60">
                    Expires
                  </p>
                  <p className="text-xs sm:text-sm font-semibold">{card.expiry}</p>
                </div>
              </div>

              {/* Overlay elements for card texture */}
              <div className="absolute -right-10 -bottom-10 size-40 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -left-10 -top-10 size-40 rounded-full bg-white/5 pointer-events-none" />

              {/* Action buttons (inline footer) */}
              <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between text-[11px] sm:text-xs text-white/80">
                {!card.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(card.id)}
                    className="hover:text-white hover:underline font-semibold cursor-pointer active:scale-95 duration-200"
                  >
                    {t("setAsDefault")}
                  </button>
                ) : (
                  <span className="flex items-center gap-1 opacity-75 font-semibold">
                    <Sparkles size={11} />
                    {t("default")}
                  </span>
                )}
                <button
                  onClick={() => handleDelete(card.id)}
                  className="hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer active:scale-95 duration-200"
                  title="Remove card"
                >
                  <Trash2 size={12} />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog Form */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[92%] sm:max-w-[420px] max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-[#800020]/10 bg-white shadow-xl animate-scale-up">
            {/* Header */}
            <div className="border-b border-[#E2D9D2]/60 bg-[#FAF7F5] px-4 py-3 flex items-center justify-between shrink-0">
              <h3 className="font-[family-name:var(--font-playfair)] text-sm sm:text-base font-bold text-[#800020]">
                {t("addBtn")}
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-lg p-1 text-[#706565] hover:bg-[#E2D9D2]/40 transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex flex-col gap-3.5">
                {/* Card Holder */}
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                    {t("form.cardHolder")}
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="NGUYEN THI AN"
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>

                {/* Card Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                    {t("form.cardNumber")}
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#706565]/60 z-10" />
                    <Input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="4123 4567 8901 2345"
                      value={number}
                      onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
                      className="pl-9 h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                    {t("form.expiryDate")}
                  </label>
                  <Input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>

                {/* CVV */}
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
                    {t("form.cvv")}
                  </label>
                  <Input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-3 border-t border-[#E2D9D2]/40 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="w-full sm:w-auto inline-flex h-9 items-center justify-center rounded-lg border border-[#E2D9D2] bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#706565] transition-all hover:bg-gray-50 cursor-pointer active:scale-95 duration-200"
                >
                  {t("form.cancelBtn")}
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex h-9 items-center justify-center rounded-lg bg-[#800020] px-5 text-[11px] font-semibold uppercase tracking-[0.5px] text-white transition-all hover:bg-[#800020]/95 cursor-pointer active:scale-95 duration-200"
                >
                  {t("form.submitBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
