"use client";

import React from "react";
import { AnimatePresence, MotionConfig, motion, type Variants } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { BackButton } from "@/components/shared/BackButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCheckout } from "../hooks/useCheckout";
import { CheckoutProgress } from "./CheckoutProgress";
import { CheckoutShippingForm } from "./CheckoutShippingForm";
import { CheckoutPaymentForm } from "./CheckoutPaymentForm";
import { CheckoutReview } from "./CheckoutReview";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Chuyển bước nhẹ: bước mới hiện dần + nhích 16px theo hướng đi (tiến → từ phải, lùi → từ trái) và 8px từ dưới;
 * bước cũ mờ nhanh. Không trượt cả khối form lớn qua màn hình nên không bị giật.
 */
const stepVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 16, y: 8 }),
  center: { opacity: 1, x: 0, y: 0, transition: { duration: 0.4, ease: EASE } },
  exit: (direction: number) => ({ opacity: 0, x: direction * -12, transition: { duration: 0.2, ease: EASE } }),
};

/** Khung chờ khi giỏ đang nạp từ localStorage */
function CheckoutSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="h-10 bg-[var(--bg-secondary)]" />
      <div className="h-[28rem] bg-[var(--bg-secondary)]" />
    </div>
  );
}

/**
 * Trang Thanh toán — cùng bố cục trang Giỏ hàng / Yêu thích (tràn màn, 2 cột ngay từ đầu trang):
 * - Trái: mũi tên về Giỏ hàng + eyebrow → tiêu đề → thanh 3 bước → khung của bước hiện tại.
 * - Phải (desktop): tóm tắt đơn ghim cố định, cao vừa màn hình (danh sách cuộn riêng, tổng tiền luôn thấy).
 * - Mobile / tablet: tóm tắt nằm dưới khung bước.
 * - Giỏ trống → EmptyState; đặt hàng xong → chuyển sang trang cảm ơn `/checkout/thank-you?token=…`.
 */
export function CheckoutExperience() {
  const {
    t,
    locale,
    isLoaded,
    cartItems,
    totals,
    hasCartDiscount,
    hasCustomItems,
    step,
    direction,
    maxStepIndex,
    goToStep,
    shippingForm,
    shipping,
    submitShipping,
    paymentMethod,
    setPaymentMethod,
    depositPercent,
    setDepositPercent,
    prepayAmount,
    submitPayment,
    isPlacing,
    placeOrder,
  } = useCheckout();

  const hasItems = isLoaded && cartItems.length > 0;
  // Hoá đơn điền dần: tên khách sau bước 1, phương thức sau bước 2 (mã đơn do server cấp khi đặt)
  const summary = (
    <CheckoutOrderSummary
      cartItems={cartItems}
      totals={totals}
      hasCartDiscount={hasCartDiscount}
      locale={locale}
      shipping={shipping}
      paymentMethod={maxStepIndex >= 2 ? paymentMethod : null}
    />
  );

  return (
    <MotionConfig reducedMotion="user">
      {/* Desktop: 2 cột ngay từ đầu trang — trái: tiêu đề + bước; phải: tóm tắt cao hết màn, ghim khi cuộn */}
      <div
        className={`font-[family-name:var(--font-lora)] text-[var(--text-main)] ${
          hasItems ? "lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-12" : ""
        }`}
      >
        <div className="min-w-0">
          {/* Tiêu đề: mũi tên về Giỏ hàng + eyebrow → tiêu đề + mô tả */}
          <header className="mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="flex items-center gap-2"
            >
              <BackButton href="/cart" variant="inline" label={t("backToCart")} />
              <p className="text-[10px] uppercase tracking-[3px] text-[var(--text-light)] sm:text-[11px]">{t("eyebrow")}</p>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
              className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl"
            >
              {t("title")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
              className="mt-1.5 max-w-xl text-[13px] leading-6 text-[var(--text-light)]"
            >
              {t("subtitle")}
            </motion.p>
          </header>

          {!isLoaded ? (
            <CheckoutSkeleton />
          ) : !hasItems ? (
            <EmptyState
              icon={ShoppingBag}
              title={t("empty.title")}
              description={t("empty.description")}
              action={t("empty.action")}
            />
          ) : (
            <>
              <CheckoutProgress step={step} maxStepIndex={maxStepIndex} onStepChange={goToStep} />

              <AnimatePresence mode="wait" initial={false} custom={direction}>
                {step === "shipping" ? (
                  <motion.div key="shipping" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                    <CheckoutShippingForm form={shippingForm} onSubmit={submitShipping} />
                  </motion.div>
                ) : null}
                {step === "payment" ? (
                  <motion.div key="payment" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                    <CheckoutPaymentForm
                      locale={locale}
                      total={totals.total}
                      hasCustomItems={hasCustomItems}
                      paymentMethod={paymentMethod}
                      onPaymentMethodChange={setPaymentMethod}
                      depositPercent={depositPercent}
                      onDepositPercentChange={setDepositPercent}
                      prepayAmount={prepayAmount}
                      onBack={() => goToStep("shipping")}
                      onSubmit={submitPayment}
                    />
                  </motion.div>
                ) : null}
                {step === "review" && shipping ? (
                  <motion.div key="review" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                    <CheckoutReview
                      shipping={shipping}
                      paymentMethod={paymentMethod}
                      depositPercent={depositPercent}
                      prepayAmount={prepayAmount}
                      total={totals.total}
                      locale={locale}
                      hasCustomItems={hasCustomItems}
                      isPlacing={isPlacing}
                      onEdit={goToStep}
                      onBack={() => goToStep("payment")}
                      onPlaceOrder={placeOrder}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Mobile / tablet: tóm tắt nằm dưới khung bước */}
              <div className="mt-10 lg:hidden">{summary}</div>
            </>
          )}
        </div>

        {/* Cột phải (desktop): tóm tắt ghim đúng vị trí ban đầu (header đo thật + --page-y), cao vừa màn hình */}
        {hasItems ? (
          <div className="hidden lg:block">
            <div className="sticky top-[calc(var(--site-header-h)+var(--page-y))] h-[calc(100svh-var(--site-header-h)-var(--page-y)-1rem)]">
              {summary}
            </div>
          </div>
        ) : null}
      </div>
    </MotionConfig>
  );
}
export default CheckoutExperience;
