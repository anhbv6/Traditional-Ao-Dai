"use client";

import { useState, type FormEvent } from "react";
import { Ban } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminTextArea,
} from "@/features/admin/core/ui";
import { type AdminOrderRow } from "../../types/orders.types";

/** Gửi yêu cầu hủy đơn — Super Admin duyệt ở màn Phê duyệt, duyệt xong hệ thống tự hủy */
export function RequestCancelDialog({
  order,
  pending,
  onOpenChange,
  onSubmit,
}: {
  order: AdminOrderRow;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
}) {
  const t = useTranslations("AdminPage.orders");
  const [reason, setReason] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason.trim()) return;
    onSubmit(reason.trim());
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={Ban}
      tone="danger"
      title={t("cancelDialog.title", { code: order.orderNumber })}
      description={t("cancelDialog.description")}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button type="submit" disabled={pending || !reason.trim()} className={ADMIN_DIALOG_DANGER_BUTTON_CLASS}>
            {pending ? t("processing") : t("cancelDialog.submit")}
          </button>
        </>
      }
    >
      <AdminTextArea
        autoFocus
        required
        label={t("cancelDialog.reason")}
        rows={3}
        maxLength={1000}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={t("cancelDialog.reasonPlaceholder")}
      />
      {order.paidAmount > 0 && <p className="mt-3 text-xs text-amber-700">{t("cancelDialog.paidWarning")}</p>}
    </AdminDialog>
  );
}
