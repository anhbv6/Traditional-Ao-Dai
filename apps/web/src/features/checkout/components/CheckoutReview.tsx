"use client";

import React from "react";
import { ArrowLeft, Check, Info, PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/shared/ActionButton";
import { formatVnd, type Locale } from "@repo/shared";
import { type CheckoutStep, type PaymentMethod, type ShippingData } from "../types/checkout.types";
import { CheckoutStepCard } from "./CheckoutStepCard";

/** Khối thông tin gọn: tiêu đề nhỏ + nút "Sửa" quay về bước tương ứng, nội dung trên nền nhạt */
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
    <div className="border border-[var(--border)] bg-[var(--bg-main)]/50">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-2.5">
        <h3 className="m-0 text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--primary-ink)]">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="-mr-1.5 inline-flex cursor-pointer items-center gap-1.5 px-1.5 py-1 text-xs text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)]"
        >
          <PenLine size={12} strokeWidth={1.6} aria-hidden="true" />
          {editLabel}
        </button>
      </div>
      <div className="px-4 py-3.5 text-sm leading-6 text-[var(--text-main)]">{children}</div>
    </div>
  );
}

interface CheckoutReviewProps {
  shipping: ShippingData;
  paymentMethod: PaymentMethod;
  depositPercent: number;
  prepayAmount: number;
  total: number;
  locale: Locale;
  hasCustomItems: boolean;
  isPlacing: boolean;
  onEdit: (step: CheckoutStep) => void;
  onBack: () => void;
  onPlaceOrder: () => void;
}

/**
 * Bước 3 — xác nhận: người nhận + địa chỉ, phương thức thanh toán (mỗi khối có nút "Sửa" quay về đúng bước).
 * Chuyển khoản / cọc → hiện số tiền phải chuyển trước; mã QR VietQR (đã điền số tiền + "THIENCANH <mã đơn>") hiện ở trang cảm ơn.
 * Nút "Đặt hàng" khoá + hiện spinner trong lúc gửi, tránh bấm nhiều lần tạo đơn trùng.
 */
export function CheckoutReview({
  shipping,
  paymentMethod,
  depositPercent,
  prepayAmount,
  total,
  locale,
  hasCustomItems,
  isPlacing,
  onEdit,
  onBack,
  onPlaceOrder,
}: CheckoutReviewProps) {
  const t = useTranslations("CheckoutPage");
  const address = [shipping.address, shipping.ward, shipping.district, shipping.province].join(", ");

  return (
    <CheckoutStepCard
      title={t("review.title")}
      description={t("review.description")}
      actions={
        <>
          <ActionButton variant="cancel" size="md" icon={<ArrowLeft />} onClick={onBack} disabled={isPlacing}>
            {t("actions.back")}
          </ActionButton>
          <ActionButton variant="confirm" size="md" icon={<Check />} loading={isPlacing} onClick={onPlaceOrder}>
            {isPlacing ? t("actions.placing") : t("actions.placeOrder")}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
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
          {paymentMethod === "DEPOSIT" ? (
            <p className="text-[13px] text-[var(--text-light)]">
              {t("review.depositLine", {
                percent: depositPercent,
                deposit: formatVnd(prepayAmount, locale),
                rest: formatVnd(Math.max(0, total - prepayAmount), locale),
              })}
            </p>
          ) : null}
          {paymentMethod === "BANK_TRANSFER" ? (
            <p className="text-[13px] text-[var(--text-light)]">{t("review.transferLine", { amount: formatVnd(prepayAmount, locale) })}</p>
          ) : null}
          {paymentMethod !== "COD" ? <p className="mt-2 text-xs text-[var(--text-light)]">{t("review.qrAfter")}</p> : null}
        </ReviewBlock>

        {hasCustomItems ? (
          <p className="flex gap-2.5 border-l-2 border-[var(--accent-color)] bg-[var(--bg-secondary)]/70 px-4 py-3 text-xs leading-5 text-[var(--text-light)]">
            <Info size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[var(--primary-ink)]" />
            {t("review.customNote")}
          </p>
        ) : null}

        <p className="text-xs leading-5 text-[var(--text-light)]">{t("review.agreement")}</p>
      </div>
    </CheckoutStepCard>
  );
}
export default CheckoutReview;
