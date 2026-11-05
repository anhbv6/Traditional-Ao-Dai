"use client";

import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminTextField,
} from "@/features/admin/core/ui";
import { createStaffAction } from "../actions/staff.actions";
import { type StaffMemberItem } from "../types/staff.types";
import { STAFF_PERMISSIONS, type Permission } from "../../../core/session/permissions";

interface CreateStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (member: StaffMemberItem) => void;
}

const EMPTY_FORM = { name: "", email: "", phone: "", password: "" };

/** Mặc định nhân viên mới chỉ được xử lý đơn và cập nhật may đo (quyền tối thiểu cho vận hành) */
const DEFAULT_PERMISSIONS: Permission[] = ["MANAGE_ORDERS", "UPDATE_TAILORING"];

/**
 * Hộp thoại Super Admin tạo tài khoản nhân viên kèm bộ quyền chi tiết ban đầu
 */
export function CreateStaffDialog({ open, onOpenChange, onCreated }: CreateStaffDialogProps) {
  const t = useTranslations("AdminPage.staff");
  const notify = useNotify();
  const [form, setForm] = useState(EMPTY_FORM);
  const [permissions, setPermissions] = useState<Permission[]>(DEFAULT_PERMISSIONS);
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

  const field = (key: keyof typeof EMPTY_FORM, type: "text" | "tel" | "email" | "password", required = true) => (
    <AdminTextField
      type={type}
      label={t(`form.${key}`)}
      value={form[key]}
      required={required}
      passwordToggle={type === "password"}
      autoComplete={type === "password" ? "new-password" : undefined}
      onValueChange={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
    />
  );

  return (
    <AdminDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      icon={UserPlus}
      title={t("createTitle")}
      description={t("createDescription")}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" onClick={close} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button type="submit" disabled={isSubmitting} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {isSubmitting ? t("creating") : t("create")}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {field("name", "text")}
          {field("phone", "tel", false)}
          <div className="sm:col-span-2">{field("email", "email")}</div>
          <div className="sm:col-span-2">{field("password", "password")}</div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[#3F3F46]">{t("form.permissions")}</legend>
          {STAFF_PERMISSIONS.map((permission) => (
            <label key={permission} className="flex cursor-pointer items-center gap-2 text-xs text-[#09090B]">
              <input
                type="checkbox"
                checked={permissions.includes(permission)}
                onChange={() =>
                  setPermissions((prev) =>
                    prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
                  )
                }
                className="size-4 rounded border-zinc-300 accent-zinc-900"
              />
              {t(`permissions.${permission}`)}
            </label>
          ))}
        </fieldset>
      </div>
    </AdminDialog>
  );
}
