"use client";

import React from "react";
import { ArrowLeft, Check, Info, PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/shared/ActionButton";
import { TextField } from "@/components/shared/TextField";
import { BANK_ACCOUNT, buildTransferContent } from "../data/bankAccount";
import { type CheckoutStep, type PaymentMethod, type ShippingData } from "../types/checkout.types";
import { StepPanel } from "@/components/shared/StepPanel";

/** Tiêu đề khối nhỏ + nút "Sửa" quay về bước tương ứng */
function ReviewBlock({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[var(--border)] pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-4">
        <h3 className="m-0 text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--primary-ink)]">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)]"
        >
          <PenLine size={12} strokeWidth={1.6} />
          {editLabel}
        </button>
      </div>
      <div className="mt-3 text-sm leading-6 text-[var(--text-main)]">{children}</div>
    </div>
  );
}

interface CheckoutReviewProps {
  shipping: ShippingData;
  paymentMethod: PaymentMethod;
  orderId: string;
  hasCustomItems: boolean;
  isPlacing: boolean;
  onEdit: (step: CheckoutStep) => void;
  onBack: () => void;
  onPlaceOrder: () => void;
}

/**
 * Bước 3 — xác nhận: người nhận + địa chỉ, phương thức thanh toán (mỗi khối có nút "Sửa" quay về đúng bước).
 * Chuyển khoản → hiện tài khoản + nội dung CK (TextField chỉ đọc, sao chép một chạm).
 * Nút "Đặt hàng" khoá + hiện spinner trong lúc gửi, tránh bấm nhiều lần tạo đơn trùng.
 */
export function CheckoutReview({
  shipping,
  paymentMethod,
  orderId,
  hasCustomItems,
  isPlacing,
  onEdit,
  onBack,
  onPlaceOrder,
}: CheckoutReviewProps) {
  const t = useTranslations("CheckoutPage");
  const address = [shipping.address, shipping.ward, shipping.district, shipping.province].join(", ");

  return (
    <StepPanel
      index={3}
      title={t("review.title")}
      description={t("review.description")}
      actions={
        <>
          <ActionButton variant="cancel" size="md" icon={<ArrowLeft />} onClick={onBack} disabled={isPlacing}>
            {t("actions.back")}
          </ActionButton>
          <ActionButton variant="confirm" size="lg" icon={<Check />} loading={isPlacing} onClick={onPlaceOrder}>
            {isPlacing ? t("actions.placing") : t("actions.placeOrder")}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        <ReviewBlock title={t("review.shippingTitle")} editLabel={t("review.edit")} onEdit={() => onEdit("shipping")}>
          <p className="font-semibold">{shipping.fullName}</p>
          <p className="text-[var(--text-light)]">
            {shipping.phone} · {shipping.email}
          </p>
          <p className="mt-1">{address}</p>
          {shipping.notes ? (
            <p className="mt-2 text-[13px] italic text-[var(--text-light)]">
              {t("review.notes")}: {shipping.notes}
            </p>
          ) : null}
        </ReviewBlock>

        <ReviewBlock title={t("review.paymentTitle")} editLabel={t("review.edit")} onEdit={() => onEdit("payment")}>
          <p className="font-semibold">{t(`payment.methods.${paymentMethod}.title`)}</p>
          {paymentMethod === "card" ? <p className="text-[13px] text-[var(--text-light)]">{t("payment.cardNote")}</p> : null}

          {paymentMethod === "bank" ? (
            <div className="mt-4 bg-[var(--bg-secondary)]/60 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-light)]">{t("review.bank.title")}</p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <TextField readOnly label={t("review.bank.bankName")} value={BANK_ACCOUNT.bankName} />
                <TextField readOnly copyable label={t("review.bank.accountNumber")} value={BANK_ACCOUNT.accountNumber} />
                <TextField readOnly label={t("review.bank.accountHolder")} value={BANK_ACCOUNT.accountHolder} />
                <TextField
                  readOnly
                  copyable
                  label={t("review.bank.content")}
                  value={buildTransferContent(orderId)}
                  helperText={t("review.bank.contentHint")}
                />
              </div>
            </div>
          ) : null}
        </ReviewBlock>

        {hasCustomItems ? (
          <p className="flex gap-2.5 border-l-2 border-[var(--accent-color)] bg-[var(--bg-secondary)]/70 px-4 py-3 text-xs leading-5 text-[var(--text-light)]">
            <Info size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[var(--primary-ink)]" />
            {t("review.customNote")}
          </p>
        ) : null}

        <p className="text-xs leading-5 text-[var(--text-light)]">{t("review.agreement")}</p>
      </div>
    </StepPanel>
  );
}
export default CheckoutReview;
