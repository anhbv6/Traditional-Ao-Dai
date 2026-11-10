"use client";

import { useState, type FormEvent } from "react";
import { BadgeCheck, Lock, LockOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminTextArea,
  AdminTooltip,
} from "@/features/admin/core/ui";
import { initialsOf } from "../../utils/customerSegments";

/** Ảnh đại diện — có ảnh thì dùng ảnh, không thì chữ cái đầu trên nền xám (đơn sắc) */
export function CustomerAvatar({ name, src, size = "md", muted }: { name: string; src: string | null; size?: "md" | "lg"; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#F4F4F5] font-medium text-[#52525B] ring-1 ring-[#E4E4E7]",
        size === "lg" ? "size-14 text-lg" : "size-9 text-xs",
        muted && "opacity-50"
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar URL tùy ý (Google / Cloudinary), không qua next/image
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

/** Dấu ✓ nhỏ cạnh email / SĐT đã xác minh */
export function VerifiedMark({ verified }: { verified: boolean }) {
  const t = useTranslations("AdminPage.customers");
  if (!verified) return null;
  return (
    <AdminTooltip content={t("verified")}>
      <BadgeCheck size={13} className="shrink-0 text-emerald-600" aria-label={t("verified")} />
    </AdminTooltip>
  );
}

/** Khóa (bắt buộc lý do) / mở khóa tài khoản khách */
export function LockCustomerDialog({
  name,
  locking,
  pending,
  onOpenChange,
  onSubmit,
}: {
  name: string;
  /** true = khóa, false = mở khóa */
  locking: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason?: string) => void;
}) {
  const t = useTranslations("AdminPage.customers");
  const [reason, setReason] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locking && !reason.trim()) return;
    onSubmit(locking ? reason.trim() : undefined);
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={locking ? Lock : LockOpen}
      tone={locking ? "danger" : "default"}
      title={locking ? t("lockDialog.lockTitle", { name }) : t("lockDialog.unlockTitle", { name })}
      description={locking ? t("lockDialog.lockDescription") : t("lockDialog.unlockDescription")}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={pending || (locking && !reason.trim())}
            className={locking ? ADMIN_DIALOG_DANGER_BUTTON_CLASS : ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {locking ? t("lockDialog.lock") : t("lockDialog.unlock")}
          </button>
        </>
      }
    >
      {locking ? (
        <AdminTextArea
          autoFocus
          required
          label={t("lockDialog.reason")}
          rows={3}
          maxLength={300}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t("lockDialog.reasonPlaceholder")}
        />
      ) : (
        <p className="text-sm text-[#3F3F46]">{t("lockDialog.unlockBody")}</p>
      )}
    </AdminDialog>
  );
}
