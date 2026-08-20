"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { type CartItem, type ShippingData, type PaymentData } from "../types/checkout.types";

export function useCheckout() {
  const t = useTranslations("Common");

  // Checkout flow step: 1, 2, 3, or 4 (4 = Success screen)
  const [step, setStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
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

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cart_items");
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse cart items for checkout", err);
      }
    }
    setIsLoaded(true);
  }, []);

  // Validate step 1
  const validateShipping = (): boolean => {
    const errors: Partial<ShippingData> = {};
    if (!shipping.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
    if (!shipping.phone.trim()) errors.phone = "Vui lòng nhập số điện thoại";
    else if (!/^[0-9]{9,11}$/.test(shipping.phone.trim())) errors.phone = "Số điện thoại không hợp lệ (9-11 số)";
    if (!shipping.email.trim()) errors.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(shipping.email)) errors.email = "Email không hợp lệ";
    if (!shipping.address.trim()) errors.address = "Vui lòng nhập địa chỉ giao hàng";
    if (!shipping.province.trim()) errors.province = "Vui lòng nhập Tỉnh/Thành phố";
    if (!shipping.district.trim()) errors.district = "Vui lòng nhập Quận/Huyện";
    if (!shipping.ward.trim()) errors.ward = "Vui lòng nhập Phường/Xã";

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate step 2
  const validatePayment = (): boolean => {
    const errors: Partial<PaymentData> = {};
    if (payment.method === "card") {
      if (!payment.cardHolder.trim()) errors.cardHolder = "Vui lòng nhập tên chủ thẻ";
      if (!payment.cardNumber.trim()) errors.cardNumber = "Vui lòng nhập số thẻ";
      else if (payment.cardNumber.replace(/\s/g, "").length < 15) errors.cardNumber = "Số thẻ không hợp lệ";
      if (!payment.cardExpiry.trim()) errors.cardExpiry = "Vui lòng nhập ngày hết hạn (MM/YY)";
      if (!payment.cardCvv.trim()) errors.cardCvv = "Vui lòng nhập mã CVV";
      else if (payment.cardCvv.length < 3) errors.cardCvv = "CVV không hợp lệ";
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

    // Clear cart
    localStorage.removeItem("cart_items");
    setCartItems([]);

    // Notify Header Cart Icon to update count
    window.dispatchEvent(new Event("cart-updated"));

    // Move to success step
    setStep(4);
  };

  // Cost calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = (subtotal > 150 || subtotal === 0) ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

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
    tax,
    total,
  };
}
export default useCheckout;
