"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { uploadImageApi } from "@/features/upload";
import { showToast } from "@/components/ui/toast";
import { changeAdminPasswordAction, updateAdminProfileAction } from "../actions/session.actions";
import { useAdminSession, useAdminSessionCache } from "../hooks/useAdminSession";
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { useNotify } from "@/hooks/useNotify";

interface AdminProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminProfileDialog({
  open,
  onOpenChange,
}: AdminProfileDialogProps) {
  const { user, isAdmin } = useAdminSession({ force: true });
  const sessionCache = useAdminSessionCache();
  const notify = useNotify();
  const tToast = useTranslations("AdminPage.toasts");
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
      setAvatarUrl(user.avatar || "");
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
        avatar: avatarUrl,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border border-zinc-200 rounded-2xl shadow-xl">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <User size={18} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900">
                Hồ sơ tài khoản Quản trị
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                Cập nhật thông tin nhận diện cá nhân và bảo mật tài khoản
              </DialogDescription>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex border border-zinc-200/80 p-0.5 rounded-lg bg-zinc-100/80 mt-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                activeTab === "info"
                  ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Thông tin cá nhân
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                activeTab === "security"
                  ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Đổi mật khẩu
            </button>
          </div>
        </DialogHeader>

        {activeTab === "info" ? (
          <form onSubmit={handleSaveInfo} className="p-6 space-y-4">
            {/* Avatar upload section */}
            <div className="flex items-center gap-4 pb-2 border-b border-zinc-100">
              <div className="relative group">
                <div className="size-16 rounded-full overflow-hidden border-2 border-zinc-200 bg-zinc-100 flex items-center justify-center font-bold text-lg text-zinc-600">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
                    <img
                      src={avatarUrl}
                      alt={name || "Avatar"}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span>{(name || user?.email || "A")[0]?.toUpperCase()}</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 shadow-md cursor-pointer transition-transform hover:scale-105"
                  title="Thay đổi ảnh đại diện"
                >
                  {isUploadingAvatar ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Camera size={12} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-900">
                  Ảnh đại diện
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Định dạng PNG, JPG, WEBP (Tối đa 5MB)
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 text-xs font-medium text-zinc-700 hover:text-zinc-900 underline underline-offset-2"
                >
                  Chọn ảnh mới
                </button>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Nhập họ và tên..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Email đăng nhập
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Email là định danh hệ thống, không thể thay đổi trực tiếp.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <div className="relative">
                  <Phone
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0987654321"
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Vai trò phân quyền
                </label>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
                  <ShieldCheck size={16} className="text-zinc-700" />
                  <span className="font-semibold text-zinc-900">
                    {isAdmin ? "Quản trị viên tối cao (Super Admin)" : "Nhân viên vận hành (Staff)"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSavingInfo || isUploadingAvatar}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {isSavingInfo ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Lưu thay đổi</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveSecurity} className="p-6 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full h-9 pl-9 pr-9 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
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
                Mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full h-9 pl-9 pr-9 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
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
                Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full h-9 pl-9 pr-9 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
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

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSavingSecurity}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {isSavingSecurity ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <span>Cập nhật mật khẩu</span>
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
