"use client";

import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { uploadImageApi } from "@/features/upload";
import { showToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_BODY_CLASS,
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminDialogFooter,
  AdminTooltip,
} from "../../ui";
import { changeAdminPasswordAction, updateAdminProfileAction } from "../actions/session.actions";
import { useAdminSession, useAdminSessionCache } from "../hooks/useAdminSession";
import { User, Mail, Phone, Lock, Camera, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNotify } from "@/hooks/useNotify";

interface AdminProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminProfileDialog({ open, onOpenChange }: AdminProfileDialogProps) {
  const { user, isAdmin } = useAdminSession({ force: true });
  const sessionCache = useAdminSessionCache();
  const notify = useNotify();
  const tToast = useTranslations("AdminPage.toasts");
  const t = useTranslations("AdminPage.profileDialog");
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");

  // Info tab form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Security tab form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nạp lại form mỗi khi mở dialog (điều chỉnh state theo prop ngay trong render, không dùng effect)
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const syncKey = open && user ? user.id : null;
  if (syncKey !== syncedFor) {
    setSyncedFor(syncKey);
    if (open && user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAvatarUrl(user.avatarUrl || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error(tToast("avatarTooLarge"));
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadImageApi(file, "avatars");
      if (res?.data?.url) {
        setAvatarUrl(res.data.url);
        notify.success(tToast("avatarUploadSuccess"));
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      showToast.error(tToast("avatarUploadError"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast.error(tToast("nameRequired"));
      return;
    }

    setIsSavingInfo(true);
    try {
      const res = await updateAdminProfileAction({
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl,
      });

      if (!res.success) {
        notify.error(res.error, "PROFILE_UPDATE_FAILED");
        return;
      }

      sessionCache.set(res.data);
      notify.success(tToast("profileUpdateSuccess"));
      onOpenChange(false);
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      showToast.error(tToast("newPasswordRequired"));
      return;
    }
    if (newPassword.length < 6) {
      notify.error("PASSWORD_MIN_LENGTH");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast.error(tToast("passwordMismatch"));
      return;
    }

    setIsSavingSecurity(true);
    try {
      const res = await changeAdminPasswordAction({ currentPassword, newPassword });

      if (!res.success) {
        notify.error(res.error, "CHANGE_PASSWORD_FAILED");
        return;
      }

      notify.success(tToast("passwordChangeSuccess"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } finally {
      setIsSavingSecurity(false);
    }
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={User}
      title={t("title")}
      description={t("subtitle")}
      bare
      toolbar={
        <div
          role="tablist"
          className="grid grid-cols-2 divide-x divide-[#E4E4E7] overflow-hidden rounded-lg border border-[#E4E4E7] bg-white shadow-2xs"
        >
          {(["info", "security"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "h-9 cursor-pointer text-sm font-medium outline-none transition-colors focus-visible:bg-[#F4F4F5]",
                activeTab === tab
                  ? "bg-[#F4F4F5] text-[#09090B]"
                  : "text-[#52525B] hover:bg-[#FAFAFA] hover:text-[#09090B]"
              )}
            >
              {tab === "info" ? t("tabProfile") : t("tabPassword")}
            </button>
          ))}
        </div>
      }
    >
      {activeTab === "info" ? (
        <form onSubmit={handleSaveInfo} className="flex min-h-0 flex-1 flex-col">
          <div className={cn(ADMIN_DIALOG_BODY_CLASS, "space-y-4")}>
            {/* Avatar upload section */}
            <div className="flex items-center gap-4 pb-2 border-b border-zinc-100">
              <div className="relative group">
                <div className="size-16 rounded-full overflow-hidden border-2 border-[#E4E4E7] bg-zinc-100 flex items-center justify-center font-semibold text-lg text-zinc-600">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
                    <img src={avatarUrl} alt={name || "Avatar"} className="size-full object-cover" />
                  ) : (
                    <span>{(name || user?.email || "A")[0]?.toUpperCase()}</span>
                  )}
                </div>

                <AdminTooltip content={t("changeAvatar")}>
                  <button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={t("changeAvatar")}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#18181B] text-white hover:bg-[#09090B] shadow-md cursor-pointer transition-transform hover:scale-105"
                  >
                    {isUploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                  </button>
                </AdminTooltip>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-[#09090B]">{t("avatar")}</p>
                <p className="text-2xs text-[#71717A] mt-0.5">{t("avatarHint")}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 text-xs font-medium text-zinc-700 hover:text-[#09090B] underline underline-offset-2"
                >
                  {t("chooseAvatar")}
                </button>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  {t("fullName")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={t("fullNamePlaceholder")}
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[#E4E4E7] bg-white text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">{t("loginEmail")}</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[#E4E4E7] bg-zinc-50 text-[#71717A] cursor-not-allowed"
                  />
                </div>
                <p className="text-2xs text-zinc-400 mt-1">{t("emailReadonly")}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">{t("phone")}</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("phonePlaceholder")}
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[#E4E4E7] bg-white text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">{t("role")}</label>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-[#E4E4E7] text-xs">
                  <ShieldCheck size={16} className="text-zinc-700" />
                  <span className="font-semibold text-[#09090B]">{isAdmin ? t("roleAdmin") : t("roleStaff")}</span>
                </div>
              </div>
            </div>
          </div>
          <AdminDialogFooter>
            <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSavingInfo || isUploadingAvatar}
              className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
            >
              {isSavingInfo ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{t("save")}</span>
              )}
            </button>
          </AdminDialogFooter>
        </form>
      ) : (
        <form onSubmit={handleSaveSecurity} className="flex min-h-0 flex-1 flex-col">
          <div className={cn(ADMIN_DIALOG_BODY_CLASS, "space-y-3.5")}>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">{t("currentPassword")}</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("currentPasswordPlaceholder")}
                  className="w-full h-9 pl-9 pr-9 text-xs rounded-lg border border-[#E4E4E7] bg-white text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t("newPassword")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder={t("newPasswordPlaceholder")}
                  className="w-full h-9 pl-9 pr-9 text-xs rounded-lg border border-[#E4E4E7] bg-white text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {t("confirmPassword")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder={t("confirmPasswordPlaceholder")}
                  className="w-full h-9 pl-9 pr-9 text-xs rounded-lg border border-[#E4E4E7] bg-white text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <AdminDialogFooter>
            <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
              {t("cancel")}
            </button>
            <button type="submit" disabled={isSavingSecurity} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
              {isSavingSecurity ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{t("updating")}</span>
                </>
              ) : (
                <span>{t("updatePassword")}</span>
              )}
            </button>
          </AdminDialogFooter>
        </form>
      )}
    </AdminDialog>
  );
}
