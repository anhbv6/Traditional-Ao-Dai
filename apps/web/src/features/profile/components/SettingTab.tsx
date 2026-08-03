"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Lock, Eye, EyeOff, Bell, Shield, Sparkles } from "lucide-react";
import { useSetting } from "../hooks/useProfile";

export function SettingTab() {
  const t = useTranslations("ProfilePage.setting");
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
    notifPromo,
    setNotifPromo,
    notifOrder,
    setNotifOrder,
    showSuccessNotif,
    handlePasswordSubmit,
    handleNotifSubmit,
  } = useSetting();

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 border-b border-[#E2D9D2]/60 pb-5">
          <div className="grid size-10 place-items-center rounded-lg bg-[#FAF7F5] text-[#800020]">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020]">
              {t("securityTitle")}
            </h2>
            <p className="text-xs text-[#706565]">
              {t("changePassword")}
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4 max-w-md">
          {showSuccessPass && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
              <Sparkles size={18} className="text-green-600 shrink-0" />
              <p className="font-medium">Cập nhật mật khẩu thành công!</p>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
              {t("currentPassword")}
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
            <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
              {t("newPassword")}
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
            <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
              {t("confirmPassword")}
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
              {t("changePassword")}
            </button>
          </div>
        </form>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 border-b border-[#E2D9D2]/60 pb-5">
          <div className="grid size-10 place-items-center rounded-lg bg-[#FAF7F5] text-[#800020]">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020]">
              {t("notifTitle")}
            </h2>
            <p className="text-xs text-[#706565]">
              Quản lý nhận thông tin tiếp thị và đơn hàng.
            </p>
          </div>
        </div>

        <form onSubmit={handleNotifSubmit} className="mt-6 space-y-6">
          {showSuccessNotif && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
              <Sparkles size={18} className="text-green-600 shrink-0" />
              <p className="font-medium">Lưu cài đặt thông báo thành công!</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Promo */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="notifPromo"
                checked={notifPromo}
                onChange={(e) => setNotifPromo(e.target.checked)}
                className="mt-1 size-4 rounded border-[#E2D9D2] text-[#800020] focus:ring-[#800020]"
              />
              <div>
                <label
                  htmlFor="notifPromo"
                  className="cursor-pointer text-sm font-semibold text-[#2A2525]"
                >
                  {t("notifPromo")}
                </label>
                <p className="text-xs text-[#706565]">
                  Nhận thông tin về các ưu đãi, bộ sưu tập mới và sự kiện sắp tới.
                </p>
              </div>
            </div>

            {/* Order Updates */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="notifOrder"
                checked={notifOrder}
                onChange={(e) => setNotifOrder(e.target.checked)}
                className="mt-1 size-4 rounded border-[#E2D9D2] text-[#800020] focus:ring-[#800020]"
              />
              <div>
                <label
                  htmlFor="notifOrder"
                  className="cursor-pointer text-sm font-semibold text-[#2A2525]"
                >
                  {t("notifOrder")}
                </label>
                <p className="text-xs text-[#706565]">
                  Cập nhật tự động về trạng thái đặt hàng, giao hàng và thanh toán.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#800020] px-6 text-xs font-semibold uppercase tracking-[1px] text-white transition-all hover:bg-[#800020]/90"
            >
              Lưu cài đặt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
