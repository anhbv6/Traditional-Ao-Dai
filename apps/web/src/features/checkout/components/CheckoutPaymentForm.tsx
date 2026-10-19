"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Banknote, CreditCard, Landmark, ShieldCheck, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/shared/ActionButton";
import { ChoiceGroup } from "@/components/shared/ChoiceGroup";
import { StepPanel } from "@/components/shared/StepPanel";
import { PAYMENT_METHODS, type PaymentMethod } from "../types/checkout.types";

const EASE = [0.22, 1, 0.36, 1] as const;

const METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  cod: Banknote,
  bank: Landmark,
  card: CreditCard,
};

interface CheckoutPaymentFormProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onBack: () => void;
  onSubmit: () => void;
}

/**
 * Bước 2 — chọn phương thức thanh toán bằng ChoiceGroup dùng chung (thẻ lựa chọn, radio thật).
 * Chọn "Thẻ" chỉ hiện ghi chú chuyển sang cổng thanh toán — site KHÔNG thu số thẻ.
 */
export function CheckoutPaymentForm({ paymentMethod, onPaymentMethodChange, onBack, onSubmit }: CheckoutPaymentFormProps) {
  const t = useTranslations("CheckoutPage");

  const options = PAYMENT_METHODS.map((method) => {
    const Icon = METHOD_ICONS[method];
    return {
      value: method,
      label: t(`payment.methods.${method}.title`),
      description: t(`payment.methods.${method}.description`),
      leading: <Icon size={20} strokeWidth={1.4} />,
    };
  });

  return (
    <StepPanel
      index={2}
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
      <ChoiceGroup label={t("payment.title")} options={options} value={paymentMethod} onChange={onPaymentMethodChange} />

      <AnimatePresence initial={false}>
        {paymentMethod === "card" ? (
          <motion.div
            key="card-note"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="mt-4 flex gap-2.5 border-l-2 border-[var(--accent-color)] bg-[var(--bg-secondary)]/70 px-4 py-3 text-xs leading-5 text-[var(--text-light)]">
              <ShieldCheck size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--primary-ink)]" />
              {t("payment.cardNote")}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </StepPanel>
  );
}
export default CheckoutPaymentForm;
