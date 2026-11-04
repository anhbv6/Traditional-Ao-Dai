"use client";

import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
} from "@/features/admin/core/ui";
import { resetStaffPasswordAction } from "../actions/staff.actions";
import { type StaffMemberItem } from "../types/staff.types";

interface ResetStaffPasswordDialogProps {
  /** Nhân viên cần đặt lại mật khẩu; null = đóng hộp thoại */
  staff: StaffMemberItem | null;
  onClose: () => void;
}

const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-xs text-[#09090B] placeholder:text-zinc-400 transition-all focus:border-[#09090B] focus:outline-none focus:ring-2 focus:ring-zinc-900/10";

/**
 * Super Admin đặt mật khẩu mới cho nhân viên — mọi phiên của nhân viên bị đăng xuất
 */
export function ResetStaffPasswordDialog({ staff, onClose }: ResetStaffPasswordDialogProps) {
  const t = useTranslations("AdminPage.staff");
  const notify = useNotify();
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => {
    setNewPassword("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;
    setIsSubmitting(true);
    try {
      const res = await resetStaffPasswordAction({ userId: staff.id, newPassword });
      if (!res.success) {
        notify.error(res.error, "STAFF_PASSWORD_RESET_FAILED");
        return;
      }
      notify.success(t("resetPasswordSuccess"));
      close();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminDialog
      open={staff !== null}
      onOpenChange={(next) => !next && close()}
      icon={KeyRound}
      title={t("resetPasswordTitle")}
      description={t("resetPasswordDescription", { name: staff?.name || staff?.email || "" })}
      size="sm"
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" onClick={close} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button type="submit" disabled={isSubmitting} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {isSubmitting ? t("resettingPassword") : t("resetPassword")}
          </button>
        </>
      }
    >
      <label className="block space-y-1">
        <span className="text-sm font-medium text-[#3F3F46]">
          {t("form.password")} <span className="text-rose-500">*</span>
        </span>
        <input
          type="password"
          value={newPassword}
          required
          autoComplete="new-password"
          onChange={(e) => setNewPassword(e.target.value)}
          className={INPUT_CLASS}
        />
      </label>
    </AdminDialog>
  );
}
