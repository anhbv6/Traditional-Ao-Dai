"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { ActionLink } from "@/components/shared/ActionLink";
import { SectionOrnament } from "@/components/shared/SectionOrnament";
import { TextField } from "@/components/shared/TextField";
import { BANK_ACCOUNT, buildTransferContent } from "../data/bankAccount";
import { type PlacedOrder } from "../types/checkout.types";

const EASE = [0.22, 1, 0.36, 1] as const;
const NEXT_STEPS = ["confirm", "prepare", "ship"] as const;

interface CheckoutSuccessProps {
  order: PlacedOrder;
  locale: Locale;
}

/**
 * Màn đặt hàng thành công (đọc từ ảnh chụp đơn — giỏ đã xoá):
 * dấu ✓ trong khung thoi → tiêu đề → mã đơn (sao chép được) + tổng + phương thức →
 * nhắc chuyển khoản / thanh toán thẻ nếu cần → 3 bước tiếp theo → tiếp tục mua sắm / xem đơn hàng.
 */
export function CheckoutSuccess({ order, locale }: CheckoutSuccessProps) {
  const t = useTranslations("CheckoutPage");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="mx-auto max-w-2xl text-center font-[family-name:var(--font-lora)] text-[var(--text-main)]"
    >
      {/* Dấu ✓ trong khung thoi — cùng hoạ tiết SectionOrnament */}
      <span className="relative mx-auto grid size-20 place-items-center text-[var(--primary-ink)]">
        <motion.span
          aria-hidden="true"
          className="absolute inset-3 rotate-45 border border-[var(--primary-color)]/40"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE }}
        />
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.25 }}>
          <Check size={30} strokeWidth={1.6} />
        </motion.span>
      </span>

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[3px] text-[var(--accent-color)]">{t("success.eyebrow")}</p>
      <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-[1.875rem] font-semibold leading-tight text-[var(--primary-ink)] sm:text-[2.5rem]">
        {t("success.title")}
      </h1>
      <p className="mt-3 text-[15px] leading-7 text-[var(--text-light)]">{t("success.description")}</p>
      <SectionOrnament className="mt-6 justify-center" />

      {/* Thông tin đơn */}
      <dl className="mt-8 grid border-y border-[var(--border)] text-left sm:grid-cols-3 sm:divide-x sm:divide-[var(--border)]">
        <div className="flex flex-col-reverse gap-1 py-4 sm:px-5">
          <dt className="text-[10px] uppercase tracking-[2px] text-[var(--text-light)]">{t("success.orderId")}</dt>
          <dd className="font-[family-name:var(--font-playfair)] text-xl font-semibold tracking-wide text-[var(--primary-ink)]">{order.orderId}</dd>
        </div>
        <div className="flex flex-col-reverse gap-1 border-t border-[var(--border)] py-4 sm:border-t-0 sm:px-5">
          <dt className="text-[10px] uppercase tracking-[2px] text-[var(--text-light)]">{t("success.total")}</dt>
          <dd className="font-[family-name:var(--font-playfair)] text-xl font-semibold tabular-nums">{formatVnd(order.total, locale)}</dd>
        </div>
        <div className="flex flex-col-reverse gap-1 border-t border-[var(--border)] py-4 sm:border-t-0 sm:px-5">
          <dt className="text-[10px] uppercase tracking-[2px] text-[var(--text-light)]">{t("success.method")}</dt>
          <dd className="text-sm font-semibold leading-6">{t(`payment.methods.${order.paymentMethod}.title`)}</dd>
        </div>
      </dl>

      <p className="mt-6 text-[13px] text-[var(--text-light)]">{t("success.emailNote", { email: order.email })}</p>

      {order.paymentMethod === "bank" ? (
        <div className="mt-6 bg-[var(--bg-card)] p-5 text-left ring-1 ring-[var(--border)] sm:p-6">
          <p className="text-[13px] leading-6 text-[var(--text-main)]">{t("success.bankReminder")}</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField readOnly label={t("review.bank.bankName")} value={BANK_ACCOUNT.bankName} />
            <TextField readOnly copyable label={t("review.bank.accountNumber")} value={BANK_ACCOUNT.accountNumber} />
            <TextField readOnly label={t("review.bank.accountHolder")} value={BANK_ACCOUNT.accountHolder} />
            <TextField readOnly copyable label={t("review.bank.content")} value={buildTransferContent(order.orderId)} />
          </div>
        </div>
      ) : null}
      {order.paymentMethod === "card" ? (
        <p className="mt-6 border-l-2 border-[var(--accent-color)] bg-[var(--bg-secondary)]/70 px-4 py-3 text-left text-xs leading-5 text-[var(--text-light)]">
          {t("success.cardReminder")}
        </p>
      ) : null}

      {/* Tiếp theo */}
      <div className="mt-10 text-left">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[3px] text-[var(--text-light)]">{t("success.nextTitle")}</p>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {NEXT_STEPS.map((key, index) => (
            <li key={key} className="border-t border-[var(--primary-color)]/40 pt-3">
              <span className="font-[family-name:var(--font-playfair)] text-sm italic text-[var(--accent-color)]">{String(index + 1).padStart(2, "0")}</span>
              <p className="mt-1 text-[13px] leading-6 text-[var(--text-main)]">{t(`success.next.${key}`)}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
        <ActionLink href="/products" variant="confirm" size="lg" icon={<ArrowRight />} iconPosition="end">
          {t("success.continue")}
        </ActionLink>
        <Link
          href="/profile/orders"
          className="border-b border-[var(--primary-color)]/30 pb-0.5 text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
        >
          {t("success.viewOrders")}
        </Link>
      </div>
    </motion.div>
  );
}
export default CheckoutSuccess;
