"use client";

import { useState, type FormEvent } from "react";
import { Banknote } from "lucide-react";
import { useTranslations } from "next-intl";
import { buildTransferContent } from "@repo/shared/orders";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminTextField,
} from "@/features/admin/core/ui";
import { type AdminOrderRow } from "../../types/orders.types";
import { useVnd } from "./OrderParts";

interface RecordPaymentDialogProps {
  order: AdminOrderRow;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { amount: number; note?: string }) => void;
}

/**
 * Ghi nhận tiền đã nhận — đối soát chuyển khoản tay theo nội dung "THIENCANH <mã>" hoặc thu COD.
 * Nút nhanh: số còn phải cọc / số còn lại của đơn; không cho vượt tổng.
 */
export function RecordPaymentDialog({ order, pending, onOpenChange, onSubmit }: RecordPaymentDialogProps) {
  const t = useTranslations("AdminPage.orders");
  const vnd = useVnd();
  const [raw, setRaw] = useState("");
  const [note, setNote] = useState("");
  const remaining = Math.max(0, order.totalAmount - order.paidAmount);
  const depositLeft = Math.max(0, order.depositAmount - order.paidAmount);
  const amount = Number(raw.replace(/\D/g, "")) || 0;
  const error = amount > remaining ? t("paymentDialog.exceeds", { remaining: vnd(remaining) }) : null;

  const presets = [
    ...(depositLeft > 0 && depositLeft < remaining ? [{ key: "deposit", label: t("paymentDialog.presetDeposit"), value: depositLeft }] : []),
    ...(remaining > 0 ? [{ key: "rest", label: t("paymentDialog.presetRest"), value: remaining }] : []),
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (amount <= 0 || error) return;
    onSubmit({ amount, note: note.trim() || undefined });
  };

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={Banknote}
      title={t("paymentDialog.title")}
      description={t("paymentDialog.description", { code: buildTransferContent(order.orderNumber) })}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button type="submit" disabled={pending || amount <= 0 || Boolean(error)} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {pending ? t("processing") : t("paymentDialog.submit")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <dl className="grid grid-cols-3 gap-3 rounded-xl border border-dashed border-[#E4E4E7] p-3 text-center">
          {[
            { key: "total", value: order.totalAmount },
            { key: "paid", value: order.paidAmount },
            { key: "remaining", value: remaining },
          ].map((item) => (
            <div key={item.key}>
              <dt className="text-xs text-[#71717A]">{t(`paymentDialog.${item.key}`)}</dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-[#09090B]">{vnd(item.value)}</dd>
            </div>
          ))}
        </dl>

        <AdminTextField
          autoFocus
          required
          label={t("paymentDialog.amount")}
          mask="currency"
          suffix="₫"
          value={raw}
          onValueChange={(value) => setRaw(value)}
          inputMode="numeric"
          placeholder={t("paymentDialog.amountPlaceholder")}
          error={error ?? undefined}
          inputClassName="font-mono tabular-nums"
        />
        {presets.length > 0 && (
          <div className="-mt-2 flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => setRaw(String(preset.value))}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-xs text-[#3F3F46] transition-colors hover:border-[#D4D4D8] hover:bg-[#FAFAFA]"
              >
                {preset.label}
                <span className="font-mono tabular-nums text-[#71717A]">{vnd(preset.value)}</span>
              </button>
            ))}
          </div>
        )}

        <AdminTextField
          label={t("paymentDialog.note")}
          value={note}
          onValueChange={setNote}
          maxLength={200}
          placeholder={t("paymentDialog.notePlaceholder")}
        />
      </div>
    </AdminDialog>
  );
}
