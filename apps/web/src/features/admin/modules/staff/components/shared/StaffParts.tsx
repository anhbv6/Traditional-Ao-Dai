"use client";

import { Lock, LockOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
} from "@/features/admin/core/ui";
import { STAFF_PERMISSIONS, type Permission } from "../../../../core/session/permissions";

/** Chữ cái đầu cho ô ảnh đại diện ("Trần Thu Hà" → "TH") */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts.length === 1 ? [parts[0]] : parts.slice(-2)).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function StaffAvatar({ name, size = "md", muted }: { name: string; size?: "md" | "lg"; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-[#F4F4F5] font-medium text-[#52525B] ring-1 ring-[#E4E4E7]",
        size === "lg" ? "size-10 text-sm" : "size-9 text-xs",
        muted && "opacity-50"
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/** Quyền tóm tắt một dòng — theo thứ tự chuẩn; chưa có quyền thì nhắc bằng chữ hổ phách */
export function PermissionSummary({ permissions, className }: { permissions: readonly Permission[]; className?: string }) {
  const t = useTranslations("AdminPage.staff");
  const granted = STAFF_PERMISSIONS.filter((permission) => permissions.includes(permission));
  if (granted.length === 0) return <span className={cn("text-amber-700", className)}>{t("noPermissions")}</span>;
  return <span className={cn("text-[#3F3F46]", className)}>{granted.map((permission) => t(`permissionShort.${permission}`)).join(" · ")}</span>;
}

/** Xác nhận khóa / mở khóa nhân viên */
export function LockStaffDialog({
  name,
  locking,
  pending,
  onOpenChange,
  onConfirm,
}: {
  name: string;
  locking: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("AdminPage.staff");
  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={locking ? Lock : LockOpen}
      tone={locking ? "danger" : "default"}
      title={locking ? t("lockDialog.lockTitle", { name }) : t("lockDialog.unlockTitle", { name })}
      description={locking ? t("lockDialog.lockDescription") : t("lockDialog.unlockDescription")}
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={locking ? ADMIN_DIALOG_DANGER_BUTTON_CLASS : ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {locking ? t("lockDialog.lock") : t("lockDialog.unlock")}
          </button>
        </>
      }
    >
      <p className="text-sm text-[#3F3F46]">{locking ? t("lockDialog.lockBody") : t("lockDialog.unlockBody")}</p>
    </AdminDialog>
  );
}
