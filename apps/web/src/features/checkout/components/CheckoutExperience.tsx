"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { useCheckout } from "../hooks/useCheckout";
import { CheckoutProgress } from "./CheckoutProgress";
import { CheckoutShippingForm } from "./CheckoutShippingForm";
import { CheckoutPaymentForm } from "./CheckoutPaymentForm";
import { CheckoutReview } from "./CheckoutReview";
import { CheckoutSuccess } from "./CheckoutSuccess";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";

export function CheckoutExperience() {
  const {
    t,
    step,
    cartItems,
    isLoaded,
    orderId,
    shipping,
    setShipping,
    shippingErrors,
    payment,
    setPayment,
    paymentErrors,
    handleNextStep,
    handlePrevStep,
    handlePlaceOrder,
    subtotal,
    shippingCost,
    tax,
    total,
  } = useCheckout();

  if (!isLoaded) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-[#800020] border-t-transparent" />
      </div>
    );
  }

  // Success Step (Step 4)
  if (step === 4) {
    return <CheckoutSuccess orderId={orderId} email={shipping.email} />;
  }

  return (
    <div className="py-4 sm:py-6 animate-fade-in font-[family-name:var(--font-lora)] text-[var(--text-main)]">
      {/* 3-STEP PROGRESS STEPPER */}
      <CheckoutProgress step={step} />

      {/* CHECKOUT CONTAINER WITH 2 COLS */}
      <div className="grid gap-8 lg:grid-cols-3 items-start mt-8">
        {/* LEFT COLUMN: ACTIVE STEP FORM */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <CheckoutShippingForm
              shipping={shipping}
              setShipping={setShipping}
              shippingErrors={shippingErrors}
              handleNextStep={handleNextStep}
            />
          )}

          {step === 2 && (
            <CheckoutPaymentForm
              payment={payment}
              setPayment={setPayment}
              paymentErrors={paymentErrors}
              handlePrevStep={handlePrevStep}
              handleNextStep={handleNextStep}
            />
          )}

          {step === 3 && (
            <CheckoutReview
              shipping={shipping}
              payment={payment}
              handlePrevStep={handlePrevStep}
              handlePlaceOrder={handlePlaceOrder}
            />
          )}
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <CheckoutOrderSummary
            cartItems={cartItems}
            subtotal={subtotal}
            shippingCost={shippingCost}
            tax={tax}
            total={total}
          />
        </div>
      </div>
    </div>
  );
}
export default CheckoutExperience;
