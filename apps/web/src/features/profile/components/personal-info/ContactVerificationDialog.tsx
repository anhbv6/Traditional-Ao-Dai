"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { OtpInput } from "@/components/shared/OtpInput";
import { type useContactVerification } from "../../hooks/useContactVerification";

type ContactVerificationDialogProps = ReturnType<typeof useContactVerification>;

/**
 * Hộp thoại xác minh / đổi Email & SĐT bằng mã 6 số
 */
export function ContactVerificationDialog({
  contactType,
  isOpen,
  step,
  value,
  setValue,
  code,
  setCode,
  cooldown,
  close,
  backToInput,
  sendCode,
  confirm,
  isSending,
  isConfirming,
}: ContactVerificationDialogProps) {
  const t = useTranslations("ProfilePage.personal");
  const isEmail = contactType === "email";
  const Icon = isEmail ? Mail : Phone;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "input") {
      sendCode();
    } else {
      confirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[420px] rounded-2xl bg-white p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <DialogTitle className="text-base sm:text-lg font-bold text-[#2A2525] font-[family-name:var(--font-playfair)]">
              {isEmail ? t("verifyEmailTitle") : t("verifyPhoneTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#706565]">
              {step === "input"
                ? isEmail
                  ? t("verifyEmailDesc")
                  : t("verifyPhoneDesc")
                : t("enterCodeDesc", { target: value })}
            </DialogDescription>
          </div>

          {step === "input" ? (
            <div className="relative">
              <Icon className="absolute left-3 sm:left-3.5 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-[#800020]/50 pointer-events-none" />
              <input
                type={isEmail ? "email" : "tel"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                autoFocus
                className="w-full h-10 rounded-xl border border-[#E2D9D2] bg-white pl-10 pr-3 sm:pl-11 sm:pr-4 text-xs sm:text-sm text-[#2A2525] outline-none transition-all duration-300 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] hover:border-[#800020]/30 shadow-xs"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <OtpInput value={code} onChange={setCode} disabled={isConfirming} />
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <button
                  type="button"
                  onClick={backToInput}
                  className="text-[#706565] hover:text-[#800020] cursor-pointer"
                >
                  {t("changeTarget")}
                </button>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={cooldown > 0 || isSending}
                  className="font-semibold text-[#800020] hover:underline cursor-pointer disabled:cursor-not-allowed disabled:text-[#706565] disabled:no-underline"
                >
                  {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resendCode")}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className="w-full sm:w-auto inline-flex h-9 sm:h-10 items-center justify-center rounded-lg border border-[#E2D9D2] bg-white px-5 text-xs font-semibold uppercase tracking-[1px] text-gray-700 transition-all hover:bg-gray-50 cursor-pointer"
            >
              {t("cancelBtn")}
            </button>
            <button
              type="submit"
              disabled={step === "input" ? isSending || !value.trim() : isConfirming || code.length !== 6}
              className="w-full sm:w-auto inline-flex h-9 sm:h-10 items-center justify-center rounded-lg bg-[#800020] px-5 text-xs font-semibold uppercase tracking-[1px] text-white transition-all hover:bg-[#800020]/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === "input"
                ? isSending
                  ? t("sendingCode")
                  : t("sendCodeBtn")
                : isConfirming
                  ? t("verifying")
                  : t("confirmBtn")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
