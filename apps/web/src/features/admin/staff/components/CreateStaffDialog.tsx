"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useNotify } from "@/hooks/useNotify";
import { createStaffAction } from "../actions";
import { type StaffMemberItem, type StaffPermissionInput } from "../types";
import { STAFF_PERMISSION_FIELDS } from "../../session/permissions";

interface CreateStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (member: StaffMemberItem) => void;
}

const EMPTY_FORM = { name: "", email: "", phone: "", password: "" };

/** Mặc định nhân viên mới chỉ được xử lý đơn và cập nhật may đo (quyền tối thiểu cho vận hành) */
const DEFAULT_PERMISSIONS: StaffPermissionInput = {
  canManageOrders: true,
  canUpdateTailoring: true,
  canManageInventory: false,
  canViewReports: false,
  canManageContent: false,
};

const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-xs text-[#09090B] placeholder:text-zinc-400 transition-all focus:border-[#09090B] focus:outline-none focus:ring-2 focus:ring-zinc-900/10";

/**
 * Hộp thoại Super Admin tạo tài khoản nhân viên kèm bộ quyền chi tiết ban đầu
 */
export function CreateStaffDialog({ open, onOpenChange, onCreated }: CreateStaffDialogProps) {
  const t = useTranslations("AdminPage.staff");
  const notify = useNotify();
  const [form, setForm] = useState(EMPTY_FORM);
  const [permissions, setPermissions] = useState<StaffPermissionInput>(DEFAULT_PERMISSIONS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => {
    setForm(EMPTY_FORM);
    setPermissions(DEFAULT_PERMISSIONS);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createStaffAction({ ...form, permissions });
      if (!res.success) {
        notify.error(res.error, "STAFF_CREATE_FAILED");
        return;
      }
      notify.success(t("createSuccess"));
      onCreated(res.data);
      close();
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (key: keyof typeof EMPTY_FORM, type: string, required = true) => (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-zinc-700">
        {t(`form.${key}`)} {required && <span className="text-rose-500">*</span>}
      </span>
      <input
        type={type}
        value={form[key]}
        required={required}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        className={INPUT_CLASS}
      />
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="admin-shell max-w-[calc(100%-2rem)] rounded-xl border border-[#E4E4E7] bg-white p-6 sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <DialogTitle className="text-base font-semibold text-[#09090B]">{t("createTitle")}</DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-[#71717A]">{t("createDescription")}</DialogDescription>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {field("name", "text")}
            {field("phone", "tel", false)}
            <div className="sm:col-span-2">{field("email", "email")}</div>
            <div className="sm:col-span-2">{field("password", "password")}</div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-zinc-700">{t("form.permissions")}</legend>
            {STAFF_PERMISSION_FIELDS.map((permission) => (
              <label key={permission} className="flex cursor-pointer items-center gap-2 text-xs text-[#09090B]">
                <input
                  type="checkbox"
                  checked={permissions[permission]}
                  onChange={() => setPermissions((prev) => ({ ...prev, [permission]: !prev[permission] }))}
                  className="size-4 rounded border-zinc-300 accent-zinc-900"
                />
                {t(`permissions.${permission}`)}
              </label>
            ))}
          </fieldset>

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
              {isSubmitting ? t("creating") : t("create")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
