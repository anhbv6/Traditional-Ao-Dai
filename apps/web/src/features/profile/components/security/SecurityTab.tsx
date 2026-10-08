"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Lock, Eye, EyeOff, Shield, ShieldAlert, Sparkles, Smartphone, LogOut, Laptop, Monitor, ChevronDown } from "lucide-react";
import { useSecurity } from "../../hooks/useProfile";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { GoogleAuthButton } from "@/features/auth";

export function SecurityTab() {
  const t = useTranslations("ProfilePage.security");
  const [isPasswordOpen, setIsPasswordOpen] = React.useState(false);
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    showSuccessPass,
    handlePasswordSubmit,
    twoFactorEnabled,
    handle2faToggle,
    show2faSetup,
    setShow2faSetup,
    otpCode,
    setOtpCode,
    handle2faVerify,
    showSuccess2fa,
    sessions,
    handleRevokeSession,
    isGoogleLinked,
    handleLinkGoogle,
    handleUnlinkGoogle,
    isLinking,
  } = useSecurity();

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes("macbook") || device.toLowerCase().includes("laptop")) {
      return <Laptop size={20} className="text-[#800020]" />;
    }
    if (device.toLowerCase().includes("iphone") || device.toLowerCase().includes("phone")) {
      return <Smartphone size={20} className="text-[#800020]" />;
    }
    return <Monitor size={20} className="text-[#800020]" />;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-sm sm:p-8 animate-fade-in">
        <div className="border-b border-[#E2D9D2]/60 pb-5">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020]">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-[#706565]">
            {t("subtitle")}
          </p>
        </div>

        {/* Two-Factor Authentication (2FA) */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 rounded-xl border border-[#E2D9D2]/60 bg-[#FAF7F5]/30">
          <div className="flex gap-4">
            <div className="grid size-12 place-items-center rounded-xl bg-white border border-[#800020]/10 text-[#800020] shrink-0">
              <Smartphone size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-[#2A2525] text-sm sm:text-base flex items-center gap-2">
                {t("twoFactor.title")}
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    twoFactorEnabled
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {twoFactorEnabled ? t("twoFactor.statusEnabled") : t("twoFactor.statusDisabled")}
                </span>
              </h3>
              <p className="text-xs text-[#706565]">
                {t("twoFactor.subtitle")}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <button
              onClick={handle2faToggle}
              className={`inline-flex min-h-10 items-center justify-center rounded-lg px-5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                twoFactorEnabled
                  ? "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                  : "bg-[#800020] text-white hover:bg-[#800020]/90"
              }`}
            >
              {twoFactorEnabled ? "Hủy kích hoạt" : "Thiết lập 2FA"}
            </button>
          </div>
        </div>

        {/* 2FA Setup Modal/Box */}
        {show2faSetup && (
          <div className="mt-6 p-6 rounded-xl border border-[#800020]/20 bg-[#FAF7F5]/40 space-y-6 animate-fade-in">
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} className="text-[#800020] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#800020] text-sm uppercase tracking-wider">
                  {t("twoFactor.setupTitle")}
                </h4>
                <p className="mt-1 text-xs text-[#706565] leading-relaxed">
                  {t("twoFactor.setupSubtitle")}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Mock QR Code */}
              <div className="bg-white p-3 rounded-lg border border-[#E2D9D2] shadow-sm select-none">
                <svg className="size-32 text-gray-800" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer border & square details */}
                  <path d="M5,5 h30 v30 h-30 z M10,10 h20 v20 h-20 z" />
                  <path d="M65,5 h30 v30 h-30 z M70,10 h20 v20 h-20 z" />
                  <path d="M5,65 h30 v30 h-30 z M10,70 h20 v20 h-20 z" />
                  {/* Decorative QR code blocks */}
                  <rect x="45" y="15" width="10" height="20" />
                  <rect x="15" y="45" width="20" height="10" />
                  <rect x="45" y="45" width="10" height="10" />
                  <rect x="75" y="45" width="10" height="20" />
                  <rect x="45" y="75" width="20" height="10" />
                  <rect x="75" y="75" width="15" height="15" />
                </svg>
              </div>

              {/* OTP Form */}
              <form onSubmit={handle2faVerify} className="flex-1 w-full max-w-xs space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#706565]">
                    Nhập mã xác thực 6 số
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center tracking-[8px] rounded-lg border border-[#E2D9D2] bg-white py-2.5 px-4 text-base font-bold text-[#2A2525] outline-none transition-all focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShow2faSetup(false)}
                    className="flex-1 min-h-9 text-center border border-[#E2D9D2] hover:bg-white/40 rounded-lg text-xs font-semibold text-[#706565]"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-9 bg-[#800020] text-white hover:bg-[#800020]/90 rounded-lg text-xs font-semibold"
                  >
                    {t("twoFactor.verifyBtn")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showSuccess2fa && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
            <Sparkles size={18} className="text-green-600 shrink-0" />
            <p className="font-medium">{t("twoFactor.success")}</p>
          </div>
        )}

        {/* Google Account Linking */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 rounded-xl border border-[#E2D9D2]/60 bg-[#FAF7F5]/30">
          <div className="flex gap-4">
            <div className="grid size-12 place-items-center rounded-xl bg-white border border-[#800020]/10 text-[#800020] shrink-0">
              <svg className="size-6" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.336 0 3.33 2.69 1.345 6.618l3.921 3.147z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.273c0-.818-.073-1.609-.209-2.373H12v4.509h6.464a5.53 5.53 0 0 1-2.4 3.636l3.818 2.964c2.236-2.064 3.618-5.1 3.618-8.736z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.245 0 5.973-1.073 7.964-2.927l-3.818-2.964c-1.055.709-2.409 1.127-4.145 1.127-3.2 0-5.91-2.155-6.873-5.055L1.209 17.273C3.2 21.2 7.236 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.127 14.182A7.16 7.16 0 0 1 4.727 12c0-.764.127-1.5.364-2.182L1.209 6.618A11.956 11.956 0 0 0 0 12c0 1.927.455 3.755 1.255 5.4l3.872-3.218z"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-[#2A2525] text-sm sm:text-base flex items-center gap-2">
                Liên kết tài khoản Google
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isGoogleLinked
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {isGoogleLinked ? "Đã liên kết" : "Chưa liên kết"}
                </span>
              </h3>
              <p className="text-xs text-[#706565]">
                Liên kết với tài khoản Google để đăng nhập nhanh chóng bằng 1-click.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end min-w-[140px] w-full sm:w-auto">
            {isGoogleLinked ? (
              <button
                type="button"
                onClick={handleUnlinkGoogle}
                disabled={isLinking}
                className="w-full sm:w-auto inline-flex min-h-10 items-center justify-center rounded-lg px-5 text-xs font-semibold uppercase tracking-wider border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
              >
                Hủy liên kết
              </button>
            ) : (
              <div className="w-full sm:w-auto relative">
                <GoogleAuthButton
                  label="Liên kết Google"
                  onCredential={handleLinkGoogle}
                  onError={() => alert("Hệ thống xác thực Google gặp sự cố. Vui lòng thử lại sau.")}
                  className="!shadow-none !border-[#800020]/25 hover:!border-[#800020]/55"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Form (Dropdown/Accordion style) */}
      <div className="rounded-2xl border border-[#800020]/10 bg-white shadow-sm overflow-hidden transition-all duration-300">
        <button
          onClick={() => setIsPasswordOpen(!isPasswordOpen)}
          className="flex w-full items-center justify-between gap-4 p-6 sm:p-8 text-left outline-none cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-[#FAF7F5] text-[#800020] shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020]">
                {t("password.title")}
              </h2>
              <p className="text-xs text-[#706565]">
                {t("password.subtitle")}
              </p>
            </div>
          </div>
          <ChevronDown
            size={20}
            className={cn(
              "text-[#706565] transition-transform duration-300 shrink-0",
              isPasswordOpen && "rotate-180 text-[#800020]"
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {isPasswordOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
            >
              <div className="border-t border-[#E2D9D2]/40 bg-[#FAF7F5]/20 p-6 sm:p-8 pt-0">
                <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4 max-w-md">
                  {showSuccessPass && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
                      <Sparkles size={18} className="text-green-600 shrink-0" />
                      <p className="font-medium">{t("password.success")}</p>
                    </div>
                  )}

                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#706565]">
                      {t("password.current")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#706565]/60" />
                      <input
                        type={showCurrent ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 pl-11 pr-11 text-sm text-[#2A2525] outline-none transition-all focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#706565]/60 hover:text-[#800020]"
                      >
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#706565]">
                      {t("password.new")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#706565]/60" />
                      <input
                        type={showNew ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 pl-11 pr-11 text-sm text-[#2A2525] outline-none transition-all focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#706565]/60 hover:text-[#800020]"
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#706565]">
                      {t("password.confirm")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#706565]/60" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 pl-11 pr-11 text-sm text-[#2A2525] outline-none transition-all focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#706565]/60 hover:text-[#800020]"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#800020] px-6 text-xs font-semibold uppercase tracking-[1px] text-white transition-all hover:bg-[#800020]/90"
                    >
                      {t("password.submit")}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Login Sessions */}
      <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 border-b border-[#E2D9D2]/60 pb-5 mb-5">
          <div className="grid size-10 place-items-center rounded-lg bg-[#FAF7F5] text-[#800020]">
            <Monitor size={20} />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020]">
              {t("sessions.title")}
            </h2>
            <p className="text-xs text-[#706565]">
              {t("sessions.subtitle")}
            </p>
          </div>
        </div>

        <div className="space-y-4.5">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#E2D9D2]/50 hover:border-[#800020]/20 transition-all bg-white"
            >
              <div className="flex items-start gap-3.5">
                <div className="grid size-10 place-items-center rounded-lg bg-[#FAF7F5] shrink-0 mt-0.5">
                  {getDeviceIcon(sess.device)}
                </div>
                <div>
                  <h4 className="font-semibold text-[#2A2525] text-sm flex items-center gap-2">
                    {sess.device}
                    {sess.isCurrent && (
                      <span className="inline-flex items-center rounded-md bg-[#800020]/5 px-2 py-0.5 text-[9px] font-semibold text-[#800020] border border-[#800020]/15">
                        Thiết bị này
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-[#706565] mt-0.5">
                    {sess.browser} • {sess.ip} • {sess.location}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#800020] mt-1.5 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#800020] animate-pulse" />
                    {sess.time}
                  </p>
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(sess.id)}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-[#E2D9D2] hover:border-rose-300 hover:text-rose-600 transition-colors shrink-0 text-[#706565]"
                  title={t("sessions.revokeBtn")}
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
