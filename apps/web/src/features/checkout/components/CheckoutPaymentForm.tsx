"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Banknote, Landmark, Scissors, ShieldCheck, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { DEPOSIT_PERCENT_MAX, DEPOSIT_PERCENT_MIN, type PaymentMethod } from "@repo/shared/orders";
import { ActionButton } from "@/components/shared/ActionButton";
import { ChoiceGroup } from "@/components/shared/ChoiceGroup";
import { cn } from "@/lib/utils";
import { CheckoutStepCard } from "./CheckoutStepCard";

const EASE = [0.22, 1, 0.36, 1] as const;

const METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  COD: Banknote,
  BANK_TRANSFER: Landmark,
  DEPOSIT: Scissors,
};

/** Mức cọc gợi ý (trong khoảng 30–50%) */
const DEPOSIT_PRESETS = [DEPOSIT_PERCENT_MIN, 40, DEPOSIT_PERCENT_MAX] as const;

interface CheckoutPaymentFormProps {
  locale: Locale;
  total: number;
  hasCustomItems: boolean;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  depositPercent: number;
  onDepositPercentChange: (percent: number) => void;
  prepayAmount: number;
  onBack: () => void;
  onSubmit: () => void;
}

/**
 * Bước 2 — phương thức thanh toán (ChoiceGroup dùng chung).
 * - Đơn may sẵn: COD hoặc chuyển khoản 100%.
 * - Đơn may đo: KHÔNG có COD 100% — cọc 30 / 40 / 50% qua VietQR (còn lại COD) hoặc chuyển khoản 100%.
 */
export function CheckoutPaymentForm({
  locale,
  total,
  hasCustomItems,
  paymentMethod,
  onPaymentMethodChange,
  depositPercent,
  onDepositPercentChange,
  prepayAmount,
  onBack,
  onSubmit,
}: CheckoutPaymentFormProps) {
  const t = useTranslations("CheckoutPage");
  const methods: PaymentMethod[] = hasCustomItems ? ["DEPOSIT", "BANK_TRANSFER"] : ["COD", "BANK_TRANSFER"];

  const options = methods.map((method) => {
    const Icon = METHOD_ICONS[method];
    return {
      value: method,
      label: t(`payment.methods.${method}.title`),
      description: t(`payment.methods.${method}.description`),
      leading: <Icon size={20} strokeWidth={1.4} />,
    };
  });

  return (
    <CheckoutStepCard
      title={t("payment.title")}
      description={t("payment.description")}
      actions={
        <>
          <ActionButton variant="cancel" size="md" icon={<ArrowLeft />} onClick={onBack}>
            {t("actions.back")}
          </ActionButton>
          <ActionButton variant="confirm" size="md" icon={<ArrowRight />} iconPosition="end" onClick={onSubmit}>
            {t("actions.toReview")}
          </ActionButton>
        </>
      }
    >
      {hasCustomItems ? (
        <p className="mb-4 flex gap-2.5 border-l-2 border-(--accent-color) bg-(--bg-secondary)/70 px-4 py-3 text-xs leading-5 text-(--text-light)">
          <ShieldCheck size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-(--primary-ink)" aria-hidden="true" />
          {t("payment.tailoredNote")}
        </p>
      ) : null}

      <ChoiceGroup label={t("payment.title")} options={options} value={paymentMethod} onChange={onPaymentMethodChange} />

      {/* Chọn mức cọc: mở ra mượt ngay dưới lựa chọn "Đặt cọc" */}
      <AnimatePresence initial={false}>
        {paymentMethod === "DEPOSIT" ? (
          <motion.div
            key="deposit"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <fieldset className="mt-4 bg-(--bg-secondary)/60 p-4 sm:p-5">
              <legend className="sr-only">{t("payment.depositLabel")}</legend>
              <p aria-hidden="true" className="text-[11px] font-semibold uppercase tracking-[2px] text-(--text-light)">
                {t("payment.depositLabel")}
              </p>
              {/* Segmented 3 mức — cùng bề rộng, mức đang chọn nền đỏ đô */}
              <div className="mt-3 grid grid-cols-3 border border-(--border) bg-(--bg-card)">
                {DEPOSIT_PRESETS.map((percent) => {
                  const isActive = depositPercent === percent;
                  return (
                    <button
                      key={percent}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => onDepositPercentChange(percent)}
                      className={cn(
                        "h-10 cursor-pointer border-r border-(--border) text-sm font-semibold tabular-nums transition-colors last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ring)",
                        isActive ? "bg-(--primary-color) text-white" : "text-(--text-main) hover:bg-(--bg-secondary)"
                      )}
                    >
                      {percent}%
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[13px] leading-6 text-(--text-main)">
                {t("payment.depositSummary", {
                  deposit: formatVnd(prepayAmount, locale),
                  rest: formatVnd(Math.max(0, total - prepayAmount), locale),
                })}
              </p>
            </fieldset>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {paymentMethod !== "COD" ? <p className="mt-4 text-xs leading-5 text-(--text-light)">{t("payment.qrNote")}</p> : null}
    </CheckoutStepCard>
  );
}
export default CheckoutPaymentForm;
