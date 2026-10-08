"use client";

import { useState } from "react";
import { VIETNAM_PHONE_REGEX, emailSchema } from "@repo/shared";
import { calculateCartTotals, useCartHydrated, useCartStore } from "@/features/cart";
import { useTranslations } from "next-intl";
import { type ShippingData, type PaymentData } from "../types/checkout.types";

export function useCheckout() {
  const t = useTranslations("Common");

  // Checkout flow step: 1, 2, 3, or 4 (4 = Success screen)
  const [step, setStep] = useState(1);
  const cartItems = useCartStore((state) => state.items);
  const discount = useCartStore((state) => state.discount);
  const isLoaded = useCartHydrated();
  const [orderId, setOrderId] = useState("");

  // Step 1: Shipping Info state
  const [shipping, setShipping] = useState<ShippingData>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    province: "",
    district: "",
    ward: "",
    notes: "",
  });
  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingData>>({});

  // Step 2: Payment Info state
  const [payment, setPayment] = useState<PaymentData>({
    method: "cod",
    cardHolder: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
  });
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentData>>({});

  // Validate step 1
  const validateShipping = (): boolean => {
    const errors: Partial<ShippingData> = {};
    if (!shipping.fullName.trim()) errors.fullName = t("checkoutErrors.fullNameRequired");
    if (!shipping.phone.trim()) errors.phone = t("checkoutErrors.phoneRequired");
    else if (!VIETNAM_PHONE_REGEX.test(shipping.phone.trim())) errors.phone = t("checkoutErrors.phoneInvalid");
    if (!shipping.email.trim()) errors.email = t("checkoutErrors.emailRequired");
    else if (!emailSchema.safeParse(shipping.email).success) errors.email = t("checkoutErrors.emailInvalid");
    if (!shipping.address.trim()) errors.address = t("checkoutErrors.addressRequired");
    if (!shipping.province.trim()) errors.province = t("checkoutErrors.provinceRequired");
    if (!shipping.district.trim()) errors.district = t("checkoutErrors.districtRequired");
    if (!shipping.ward.trim()) errors.ward = t("checkoutErrors.wardRequired");

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate step 2
  const validatePayment = (): boolean => {
    const errors: Partial<PaymentData> = {};
    if (payment.method === "card") {
      if (!payment.cardHolder.trim()) errors.cardHolder = t("checkoutErrors.cardHolderRequired");
      if (!payment.cardNumber.trim()) errors.cardNumber = t("checkoutErrors.cardNumberRequired");
      else if (payment.cardNumber.replace(/\s/g, "").length < 15) errors.cardNumber = t("checkoutErrors.cardNumberInvalid");
      if (!payment.cardExpiry.trim()) errors.cardExpiry = t("checkoutErrors.cardExpiryRequired");
      if (!payment.cardCvv.trim()) errors.cardCvv = t("checkoutErrors.cardCvvRequired");
      else if (payment.cardCvv.length < 3) errors.cardCvv = t("checkoutErrors.cardCvvInvalid");
    }
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submit navigation
  const handleNextStep = () => {
    if (step === 1) {
      if (validateShipping()) setStep(2);
    } else if (step === 2) {
      if (validatePayment()) setStep(3);
    }
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  // Final Order placement
  const handlePlaceOrder = () => {
    // Generate order ID
    const randomId = `AD${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(randomId);

    // Xóa giỏ hàng (mini-cart ở header tự cập nhật vì dùng chung store)
    useCartStore.getState().clear();

    // Move to success step
    setStep(4);
  };

  // Cost calculations
  // Dùng chung công thức với trang giỏ hàng (Backend sẽ tính lại khi có API đặt hàng)
  const { subtotal, shippingCost, total } = calculateCartTotals(cartItems, discount);

  return {
    t,
    step,
    setStep,
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
    total,
  };
}
export default useCheckout;
