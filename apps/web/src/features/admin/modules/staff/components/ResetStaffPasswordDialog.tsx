"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useNotify } from "@/hooks/useNotify";
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
    <Dialog open={staff !== null} onOpenChange={(next) => !next && close()}>
      <DialogContent className="admin-shell max-w-[calc(100%-2rem)] rounded-xl border border-[#E4E4E7] bg-white p-6 sm:max-w-[420px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <DialogTitle className="text-base font-semibold text-[#09090B]">{t("resetPasswordTitle")}</DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-[#71717A]">
              {t("resetPasswordDescription", { name: staff?.name || staff?.email || "" })}
            </DialogDescription>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-zinc-700">
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

          <div className="flex justify-end gap-2 border-t border-[#E4E4E7] pt-4">
            <button
              type="button"
              onClick={close}
              className="cursor-pointer rounded-lg px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-[#09090B]"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-lg bg-[#18181B] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#09090B] disabled:opacity-60"
            >
              {isSubmitting ? t("resettingPassword") : t("resetPassword")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
