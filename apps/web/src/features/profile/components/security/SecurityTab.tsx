"use client";

import React, { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { KeyRound, Laptop, LogOut, Monitor, Smartphone, Tablet, Unlink, type LucideIcon } from "lucide-react";
import { GoogleAuthButton } from "@/features/auth";
import { showToast as toast } from "@/components/ui/toast";
import { ActionButton } from "@/components/shared/ActionButton";
import { AppLoadingSpinner } from "@/components/shared/AppLoading";
import { AppDialog } from "@/components/shared/AppDialog";
import { TextField } from "@/components/shared/TextField";
import { cn } from "@/lib/utils";
import { useSecurity, type DeviceKind } from "../../hooks/useProfile";
import { ProfileSection } from "../ProfileSection";

const DEVICE_ICON: Record<DeviceKind, LucideIcon> = { desktop: Monitor, laptop: Laptop, phone: Smartphone, tablet: Tablet };

/** Logo Google nhiều màu (giữ màu thương hiệu, không theo token) */
function GoogleMark() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.336 0 3.33 2.69 1.345 6.618l3.921 3.147z" />
      <path fill="#4285F4" d="M23.49 12.273c0-.818-.073-1.609-.209-2.373H12v4.509h6.464a5.53 5.53 0 0 1-2.4 3.636l3.818 2.964c2.236-2.064 3.618-5.1 3.618-8.736z" />
      <path fill="#34A853" d="M12 24c3.245 0 5.973-1.073 7.964-2.927l-3.818-2.964c-1.055.709-2.409 1.127-4.145 1.127-3.2 0-5.91-2.155-6.873-5.055L1.209 17.273C3.2 21.2 7.236 24 12 24z" />
      <path fill="#FBBC05" d="M5.127 14.182A7.16 7.16 0 0 1 4.727 12c0-.764.127-1.5.364-2.182L1.209 6.618A11.956 11.956 0 0 0 0 12c0 1.927.455 3.755 1.255 5.4l3.872-3.218z" />
    </svg>
  );
}

/**
 * Bảo mật tài khoản: đổi mật khẩu · đăng nhập bằng Google · phiên đăng nhập đang hoạt động.
 * Huỷ liên kết Google và đăng xuất thiết bị đều qua hộp thoại xác nhận chung.
 */
export function SecurityTab() {
  const t = useTranslations("ProfilePage.security");
  const tProfile = useTranslations("ProfilePage");
  const format = useFormatter();
  const security = useSecurity();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  const { passwordErrors: errors, passwordSubmitCount: shakeKey } = security;

  return (
    <>
      {/* ---------- Đổi mật khẩu ---------- */}
      <ProfileSection
        title={security.hasPassword ? t("password.title") : t("password.setTitle")}
        description={security.hasPassword ? t("password.subtitle") : t("password.setSubtitle")}
      >
        <form onSubmit={security.handlePasswordSubmit} noValidate className="max-w-md space-y-5">
          {security.hasPassword ? (
            <TextField
              appearance="outline"
              size="md"
              type="password"
              passwordToggle
              label={t("password.current")}
              autoComplete="current-password"
              placeholder={t("password.currentPlaceholder")}
              helperText={t("password.currentHint")}
              value={security.currentPassword}
              onValueChange={security.setCurrentPassword}
              error={errors.current}
              shakeKey={shakeKey}
              disabled={security.isChangingPassword}
            />
          ) : null}
          <TextField
            appearance="outline"
            size="md"
            type="password"
            passwordToggle
            required
            label={t("password.new")}
            autoComplete="new-password"
            placeholder={t("password.newPlaceholder")}
            value={security.newPassword}
            onValueChange={security.setNewPassword}
            error={errors.new}
            shakeKey={shakeKey}
            disabled={security.isChangingPassword}
          />
          <TextField
            appearance="outline"
            size="md"
            type="password"
            passwordToggle
            required
            label={t("password.confirm")}
            autoComplete="new-password"
            placeholder={t("password.confirmPlaceholder")}
            value={security.confirmPassword}
            onValueChange={security.setConfirmPassword}
            error={errors.confirm}
            shakeKey={shakeKey}
            disabled={security.isChangingPassword}
          />
          <ActionButton type="submit" variant="confirm" icon={<KeyRound />} loading={security.isChangingPassword}>
            {security.isChangingPassword ? t("password.saving") : t("password.submit")}
          </ActionButton>
        </form>
      </ProfileSection>

      {/* ---------- Google ---------- */}
      <ProfileSection title={t("google.title")} description={t("google.desc")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center border border-[var(--border)] bg-[var(--bg-main)]">
              <GoogleMark />
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[1.5px]",
                security.isGoogleLinked ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--text-light)]",
              )}
            >
              {security.isGoogleLinked ? t("google.linked") : t("google.unlinked")}
            </span>
          </div>
          <div className="w-full sm:w-64">
            {security.isGoogleLinked ? (
              <ActionButton variant="danger" fullWidth icon={<Unlink />} onClick={() => setConfirmUnlink(true)}>
                {t("google.unlinkBtn")}
              </ActionButton>
            ) : (
              <GoogleAuthButton
                label={t("google.linkBtn")}
                loading={security.isLinking}
                onCredential={security.linkGoogle}
                onError={() => toast.error(t("google.error"))}
              />
            )}
          </div>
        </div>
      </ProfileSection>

      {/* ---------- Phiên đăng nhập ---------- */}
      <ProfileSection title={t("sessions.title")} description={t("sessions.subtitle")} flush>
        {security.isLoadingSessions ? (
          <div className="grid place-items-center py-10">
            <AppLoadingSpinner size={32} />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {security.sessions.map((session) => {
              const Icon = DEVICE_ICON[session.kind];
              return (
                <li key={session.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <span className="grid size-10 shrink-0 place-items-center border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary-ink)]">
                    <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-[var(--text-main)]">
                      {session.device ?? t("sessions.unknownDevice")}
                      {session.isCurrent ? (
                        <span className="border border-[var(--primary-color)]/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[1px] text-[var(--primary-ink)]">
                          {t("sessions.current")}
                        </span>
                      ) : null}
                      {session.isAdminArea ? (
                        <span className="border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-light)]">
                          {t("sessions.adminArea")}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--text-light)]">
                      {session.browser ?? t("sessions.unknownBrowser")} · {session.ip}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[1px] text-[var(--text-light)]/80">
                      {session.isCurrent
                        ? t("sessions.active")
                        : t("sessions.signedInAt", {
                            time: format.dateTime(new Date(session.createdAt), {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }),
                          })}
                    </p>
                  </div>
                  {!session.isCurrent ? (
                    <ActionButton
                      variant="danger"
                      size="sm"
                      icon={<LogOut />}
                      aria-label={t("sessions.revokeBtn")}
                      onClick={() => setRevokingId(session.id)}
                    >
                      <span className="hidden sm:inline">{t("sessions.revokeBtn")}</span>
                    </ActionButton>
                  ) : null}
                </li>
              );
            })}
            {security.sessions.length <= 1 ? (
              <li className="px-5 py-4 text-[13px] italic text-[var(--text-light)] sm:px-6">{t("sessions.empty")}</li>
            ) : null}
          </ul>
        )}
      </ProfileSection>

      <AppDialog
        open={revokingId !== null}
        onOpenChange={(open) => !open && setRevokingId(null)}
        tone="danger"
        size="sm"
        title={t("sessions.revokeDialog.title")}
        description={t("sessions.revokeDialog.message")}
        confirm={{
          label: t("sessions.revokeDialog.confirmBtn"),
          icon: <LogOut />,
          // Lỗi đã báo bằng toast trong onError của mutation → hộp thoại giữ mở để thử lại
          onClick: async () => {
            if (revokingId) await security.revokeSession(revokingId);
          },
        }}
        cancel={{ label: tProfile("logoutDialog.cancelBtn") }}
      />

      <AppDialog
        open={confirmUnlink}
        onOpenChange={setConfirmUnlink}
        tone="danger"
        size="sm"
        title={t("google.unlinkDialog.title")}
        description={t("google.unlinkDialog.message")}
        confirm={{ label: t("google.unlinkDialog.confirmBtn"), icon: <Unlink />, onClick: security.unlinkGoogle }}
        cancel={{ label: tProfile("logoutDialog.cancelBtn") }}
      />
    </>
  );
}
