"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppDialog } from "@/components/shared/AppDialog";
import { useCustomerLogout } from "../hooks/useCustomerLogout";

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Việc bổ sung trước khi chuyển trang (VD đăng xuất luôn phiên admin ở storefront) */
  beforeRedirect?: () => Promise<void> | void;
}

/**
 * Hộp thoại xác nhận đăng xuất dùng chung (header, menu mobile, trang tài khoản) — dựng trên AppDialog.
 * Bấm xác nhận: nút tự loading và khoá đóng cho tới khi đăng xuất xong rồi chuyển về /login.
 */
export function LogoutDialog({ open, onOpenChange, beforeRedirect }: LogoutDialogProps) {
  const t = useTranslations("ProfilePage.logoutDialog");
  const { logout } = useCustomerLogout(beforeRedirect);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="danger"
      icon={LogOut}
      size="sm"
      title={t("title")}
      description={t("message")}
      confirm={{ label: t("confirmBtn"), icon: <LogOut />, onClick: logout }}
      cancel={{ label: t("cancelBtn") }}
    />
  );
}
