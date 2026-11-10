"use client";

import { useState, type FormEvent } from "react";
import { Ban, Check, PackageCheck, PackageOpen, Undo2, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import {
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDatePicker,
  AdminDialog,
  AdminField,
  AdminTextArea,
  AdminTextField,
} from "@/features/admin/core/ui";
import { type AfterSalesTicket, type TicketAction } from "../../types/returns.types";

export type DialogKind = "ACCEPT" | "REJECT" | "RECEIVE" | "READY" | "REQUEST_REFUND" | "DONE";

const ICONS: Record<DialogKind, LucideIcon> = {
  ACCEPT: Check,
  REJECT: Ban,
  RECEIVE: PackageOpen,
  READY: PackageCheck,
  REQUEST_REFUND: Undo2,
  DONE: Check,
};

interface TicketActionDialogProps {
  ticket: AfterSalesTicket;
  kind: DialogKind;
  onOpenChange: (open: boolean) => void;
  onSubmit: (action: TicketAction) => void;
}

/**
 * Một dialog cho mọi bước của phiếu — mỗi bước chỉ hỏi đúng thứ cần: tiếp nhận (ngày hẹn), từ chối (lý do bắt buộc),
 * nhận áo (mã vận đơn nếu gửi bưu điện), xong (phí sửa ngoài chính sách), hoàn tiền (số tiền, qua phê duyệt), trả khách.
 */
export function TicketActionDialog({ ticket, kind, onOpenChange, onSubmit }: TicketActionDialogProps) {
  const t = useTranslations("AdminPage.returns");
  const locale = useLocale() as Locale;
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [tracking, setTracking] = useState(ticket.trackingCode ?? "");
  const [feeRaw, setFeeRaw] = useState("");

  const fee = Number(feeRaw.replace(/\D/g, "")) || 0;
  const trimmed = note.trim() || null;
  const canSubmit = kind !== "REJECT" || Boolean(trimmed);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    switch (kind) {
      case "ACCEPT":
        return onSubmit({ kind, appointmentAt: date ? new Date(`${date}T09:00:00+07:00`).toISOString() : null, note: trimmed });
      case "REJECT":
        return onSubmit({ kind, note: trimmed ?? "" });
      case "RECEIVE":
        return onSubmit({ kind, trackingCode: tracking.trim() || null, note: trimmed });
      case "READY":
        return onSubmit({ kind, fee, note: trimmed });
      case "REQUEST_REFUND":
        return onSubmit({ kind, note: trimmed });
      case "DONE":
        return onSubmit({ kind, note: trimmed });
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={ICONS[kind]}
      tone={kind === "REJECT" ? "danger" : "default"}
      title={t(`dialog.${kind}.title`)}
      description={t(`dialog.${kind}.description`, { code: ticket.code })}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={kind === "REJECT" ? ADMIN_DIALOG_DANGER_BUTTON_CLASS : ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {t(`dialog.${kind}.submit`)}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {kind === "ACCEPT" && (
          <AdminField label={ticket.handover === "STORE" ? t("dialog.ACCEPT.dateStore") : t("dialog.ACCEPT.datePost")} hint={t("dialog.ACCEPT.dateHint")}>
            <AdminDatePicker value={date} onChange={setDate} />
          </AdminField>
        )}

        {kind === "RECEIVE" && ticket.handover === "POST" && (
          <AdminTextField
            label={t("dialog.RECEIVE.tracking")}
            value={tracking}
            onValueChange={setTracking}
            placeholder={t("dialog.RECEIVE.trackingPlaceholder")}
            inputClassName="font-mono"
          />
        )}

        {kind === "READY" && (
          <div>
            <AdminTextField
              label={t("dialog.READY.fee")}
              hint={t("dialog.READY.feeHint")}
              mask="currency"
              suffix="₫"
              inputMode="numeric"
              value={feeRaw}
              onValueChange={setFeeRaw}
              placeholder="0"
              inputClassName="font-mono tabular-nums"
            />
          </div>
        )}

        {kind === "REQUEST_REFUND" && (
          <div className="rounded-xl border border-dashed border-[#E4E4E7] px-4 py-3">
            <p className="text-xs text-[#71717A]">{t("dialog.REQUEST_REFUND.amount")}</p>
            <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-[#09090B]">{formatVnd(ticket.itemPrice, locale)}</p>
            <p className="mt-1 text-xs text-[#71717A]">{t("dialog.REQUEST_REFUND.approvalNote")}</p>
          </div>
        )}

        <AdminTextArea
          required={kind === "REJECT"}
          autoFocus={kind === "REJECT" || kind === "DONE"}
          label={kind === "REJECT" ? t("dialog.REJECT.reason") : t("dialog.note")}
          rows={3}
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t(`dialog.${kind}.notePlaceholder`)}
        />
      </div>
    </AdminDialog>
  );
}
