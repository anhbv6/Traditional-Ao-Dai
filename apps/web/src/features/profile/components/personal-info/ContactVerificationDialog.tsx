"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, Phone, Send, ShieldCheck } from "lucide-react";
import { VIETNAM_PHONE_REGEX, emailSchema } from "@repo/shared";
import { ActionButton } from "@/components/shared/ActionButton";
import { AppDialog } from "@/components/shared/AppDialog";
import { OtpInput } from "@/components/shared/OtpInput";
import { TextField } from "@/components/shared/TextField";
import { type useContactVerification } from "../../hooks/useContactVerification";

type ContactVerificationDialogProps = ReturnType<typeof useContactVerification>;

const FORM_ID = "contact-verification-form";

/**
 * Hộp thoại thêm / đổi / xác minh Email & SĐT bằng mã 6 số (2 bước: nhập địa chỉ → nhập mã).
 * Định dạng email / SĐT được kiểm tra ngay dưới ô trước khi gọi API gửi mã.
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
  const [error, setError] = useState("");
  const [submitCount, setSubmitCount] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitCount((count) => count + 1);

    if (step === "input") {
      const trimmed = value.trim();
      const valid = isEmail ? emailSchema.safeParse(trimmed).success : VIETNAM_PHONE_REGEX.test(trimmed);
      if (!valid) {
        setError(isEmail ? t("emailInvalid") : t("phoneInvalid"));
        return;
      }
      sendCode();
    } else if (code.length === 6) {
      confirm();
    }
  };

  const handleClose = () => {
    setError("");
    close();
  };

  return (
    <AppDialog
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      icon={isEmail ? Mail : Phone}
      title={isEmail ? t("verifyEmailTitle") : t("verifyPhoneTitle")}
      description={
        step === "input" ? (isEmail ? t("verifyEmailDesc") : t("verifyPhoneDesc")) : t("enterCodeDesc", { target: value })
      }
      size="sm"
      dismissible={!isSending && !isConfirming}
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ActionButton variant="cancel" onClick={handleClose} disabled={isSending || isConfirming}>
            {t("cancelBtn")}
          </ActionButton>
          {step === "input" ? (
            <ActionButton type="submit" form={FORM_ID} variant="confirm" icon={<Send />} loading={isSending}>
              {isSending ? t("sendingCode") : t("sendCodeBtn")}
            </ActionButton>
          ) : (
            <ActionButton
              type="submit"
              form={FORM_ID}
              variant="confirm"
              icon={<ShieldCheck />}
              loading={isConfirming}
              disabled={code.length !== 6}
            >
              {isConfirming ? t("verifying") : t("confirmBtn")}
            </ActionButton>
          )}
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
        {step === "input" ? (
          <TextField
            appearance="outline"
            size="md"
            type={isEmail ? "email" : "tel"}
            label={isEmail ? t("email") : t("phone")}
            prefix={isEmail ? <Mail /> : <Phone />}
            autoComplete={isEmail ? "email" : "tel"}
            placeholder={isEmail ? t("emailPlaceholder") : t("phonePlaceholder")}
            value={value}
            onValueChange={(next) => {
              setValue(next);
              if (error) setError("");
            }}
            error={error || undefined}
            shakeKey={submitCount}
            disabled={isSending}
            autoFocus
          />
        ) : (
          <div className="space-y-3">
            <OtpInput value={code} onChange={setCode} disabled={isConfirming} inputClassName="rounded-none" />
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={backToInput}
                className="cursor-pointer text-[var(--text-light)] underline-offset-4 transition-colors hover:text-[var(--primary-ink)] hover:underline"
              >
                {t("changeTarget")}
              </button>
              <button
                type="button"
                onClick={sendCode}
                disabled={cooldown > 0 || isSending}
                className="cursor-pointer font-semibold text-[var(--primary-ink)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[var(--text-light)] disabled:no-underline"
              >
                {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resendCode")}
              </button>
            </div>
          </div>
        )}
      </form>
    </AppDialog>
  );
}
