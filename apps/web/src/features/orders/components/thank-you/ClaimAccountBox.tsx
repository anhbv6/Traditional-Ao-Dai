"use client";

import { CircleCheck, KeyRound, LogIn, Send, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { GoogleAuthButton } from "@/features/auth";
import { ActionButton } from "@/components/shared/ActionButton";
import { ActionLink } from "@/components/shared/ActionLink";
import { OtpInput } from "@/components/shared/OtpInput";
import { TextField } from "@/components/shared/TextField";
import { useNotify } from "@/hooks/useNotify";
import { useClaimAccount } from "../../hooks/useClaimAccount";

/**
 * Cuối phễu (trang cảm ơn): mời khách vãng lai tạo tài khoản từ chính đơn vừa đặt.
 * Chỉ cần mã OTP gửi tới SĐT của đơn + mật khẩu (hoặc Google) — tên, SĐT, email, địa chỉ, số đo lấy từ đơn.
 * Thông tin đã thuộc tài khoản khác → mời đăng nhập (không nói rõ trùng email hay SĐT).
 */
export function ClaimAccountBox({ token, onCreated }: { token: string; onCreated?: () => void }) {
  const t = useTranslations("OrdersPage.claim");
  const tErrors = useTranslations("Errors");
  const notify = useNotify();
  const claim = useClaimAccount(token, onCreated);

  if (claim.outcome === "created") {
    return (
      <section className="border border-(--success)/40 bg-(--success)/5 p-5 sm:p-6">
        <p className="flex items-center gap-2 font-semibold text-(--text-main)">
          <CircleCheck size={18} className="text-(--success)" aria-hidden="true" />
          {t("createdTitle")}
        </p>
        <p className="mt-2 text-sm leading-6 text-(--text-light)">{t("createdDescription")}</p>
        <ActionLink href="/my-orders" variant="confirm" size="md" className="mt-4">
          {t("viewOrders")}
        </ActionLink>
      </section>
    );
  }

  if (claim.outcome === "exists") {
    return (
      <section className="border border-(--border) bg-(--bg-card) p-5 sm:p-6">
        <p className="flex items-center gap-2 font-semibold">
          <LogIn size={18} className="text-(--primary-ink)" aria-hidden="true" />
          {t("existsTitle")}
        </p>
        <p className="mt-2 text-sm leading-6 text-(--text-light)">{t("existsDescription")}</p>
        <ActionLink href="/login" variant="confirm" size="md" className="mt-4">
          {t("signIn")}
        </ActionLink>
      </section>
    );
  }

  return (
    <section className="border border-(--primary-color)/30 bg-(--bg-card) p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[2.5px] text-(--primary-ink)">
        <UserPlus size={14} strokeWidth={1.6} aria-hidden="true" />
        {t("eyebrow")}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-semibold text-(--primary-ink)">{t("title")}</h2>
      <p className="mt-2 text-sm leading-6 text-(--text-light)">{t("description")}</p>

      {!claim.otpSent ? (
        <ActionButton variant="confirm" size="md" icon={<Send />} className="mt-5" loading={claim.isSending} onClick={claim.sendOtp}>
          {t("sendCode")}
        </ActionButton>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="space-y-2">
            <p className="text-xs leading-5 text-(--text-light)">{t("codeSentTo", { phone: claim.maskedPhone })}</p>
            <OtpInput value={claim.code} onChange={claim.setCode} autoFocus />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              claim.submitPassword();
            }}
            className="space-y-4"
            noValidate
          >
            <TextField
              type="password"
              passwordToggle
              autoComplete="new-password"
              label={t("passwordLabel")}
              placeholder={t("passwordPlaceholder")}
              value={claim.password}
              onValueChange={claim.setPassword}
              error={claim.passwordError ? tErrors(claim.passwordError) : undefined}
            />
            <ActionButton
              type="submit"
              variant={claim.canSubmit ? "confirm" : "disabled"}
              size="md"
              fullWidth
              icon={<KeyRound />}
              loading={claim.isSubmitting}
            >
              {t("submit")}
            </ActionButton>
          </form>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[2px] text-(--text-light)">
            <span className="h-px flex-1 bg-(--border)" />
            {t("or")}
            <span className="h-px flex-1 bg-(--border)" />
          </div>
          <GoogleAuthButton
            label={t("google")}
            disabled={!claim.canSubmit}
            loading={claim.isSubmitting}
            onCredential={claim.submitGoogle}
            onError={() => notify.error("GOOGLE_AUTH_FAILED")}
          />
          {!claim.canSubmit ? <p className="text-xs text-(--text-light)">{t("codeFirst")}</p> : null}
        </div>
      )}
    </section>
  );
}
