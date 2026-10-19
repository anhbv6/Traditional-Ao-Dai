"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useLenis } from "lenis/react";
import { type Locale } from "@repo/shared";
import { calculateCartTotals, useCartHydrated, useCartStore } from "@/features/cart";
import { shippingSchema } from "../validations/checkout.validation";
import {
  CHECKOUT_STEPS,
  type CheckoutStep,
  type PaymentMethod,
  type PlacedOrder,
  type ShippingData,
  type ShippingFormInput,
} from "../types/checkout.types";

/** Thời gian giả lập gửi đơn (chưa có API đặt hàng) — đủ để thấy trạng thái "Đang đặt hàng…" */
const PLACE_ORDER_DELAY_MS = 900;

const EMPTY_SHIPPING: ShippingFormInput = {
  fullName: "",
  phone: "",
  email: "",
  province: "",
  district: "",
  ward: "",
  address: "",
  notes: "",
};

/** Mã đơn tạm (Backend sẽ cấp khi có API) */
const createOrderId = () => `AD${Math.floor(100000 + Math.random() * 900000)}`;

/**
 * Luồng thanh toán 3 bước: Giao hàng → Thanh toán → Xác nhận → (Thành công).
 * - Bước 1 dùng React Hook Form + Zod (validator chung @repo/shared); giá trị giữ nguyên khi qua lại giữa các bước.
 * - Chỉ quay lại được những bước đã hoàn thành (`maxStep`); mỗi lần đổi bước cuộn mượt về đầu trang.
 * - Đặt hàng: khoá nút trong lúc gửi, chụp lại thông tin đơn rồi mới xoá giỏ (màn thành công đọc từ ảnh chụp).
 * - Tổng tiền dùng chung công thức với giỏ hàng (kể cả mã giảm giá đã áp dụng). Backend tính lại khi có API.
 */
export function useCheckout() {
  const t = useTranslations("CheckoutPage");
  const locale = useLocale() as Locale;
  const lenis = useLenis();
  const cartItems = useCartStore((state) => state.items);
  const discount = useCartStore((state) => state.discount);
  const isLoaded = useCartHydrated();

  const [step, setStep] = useState<CheckoutStep>("shipping");
  /** Bước xa nhất đã mở khoá — các bước trước đó bấm quay lại được trên thanh tiến trình */
  const [maxStepIndex, setMaxStepIndex] = useState(0);
  /** Hướng đổi bước gần nhất: 1 = tiến, -1 = lùi — khung bước trượt vào từ phía tương ứng */
  const [direction, setDirection] = useState<1 | -1>(1);
  const [shipping, setShipping] = useState<ShippingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [orderId, setOrderId] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  const shippingForm = useForm<ShippingFormInput, unknown, ShippingData>({
    resolver: zodResolver(shippingSchema),
    /* Kiểm tra khi rời ô lần đầu, sau đó kiểm tra lại theo từng lần gõ */
    mode: "onTouched",
    defaultValues: EMPTY_SHIPPING,
  });

  const totals = calculateCartTotals(cartItems, discount);
  const hasCustomItems = cartItems.some((item) => Boolean(item.measurements));

  const scrollToTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 0.8 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const moveTo = (next: CheckoutStep) => {
    if (next === step) return;
    setDirection(CHECKOUT_STEPS.indexOf(next) > CHECKOUT_STEPS.indexOf(step) ? 1 : -1);
    setStep(next);
    scrollToTop();
  };

  const goToStep = (next: CheckoutStep) => {
    if (CHECKOUT_STEPS.indexOf(next) > maxStepIndex) return;
    moveTo(next);
  };

  const unlockAndGo = (next: CheckoutStep) => {
    setMaxStepIndex((value) => Math.max(value, CHECKOUT_STEPS.indexOf(next)));
    moveTo(next);
  };

  /** Bước 1 → 2: hợp lệ thì lưu thông tin giao hàng (đã chuẩn hoá: SĐT bỏ khoảng trắng, trim) */
  const submitShipping = shippingForm.handleSubmit((data) => {
    setShipping(data);
    unlockAndGo("payment");
  });

  /** Bước 2 → 3: cấp mã đơn tạm để hiện nội dung chuyển khoản ở bước xác nhận */
  const submitPayment = () => {
    if (!orderId) setOrderId(createOrderId());
    unlockAndGo("review");
  };

  const placeOrder = async () => {
    if (!shipping || isPlacing) return;
    setIsPlacing(true);
    await new Promise((resolve) => setTimeout(resolve, PLACE_ORDER_DELAY_MS));

    // Chụp lại đơn TRƯỚC khi xoá giỏ (mini-cart ở header tự cập nhật vì dùng chung store)
    setPlacedOrder({ orderId: orderId || createOrderId(), email: shipping.email, total: totals.total, paymentMethod });
    useCartStore.getState().clear();
    setIsPlacing(false);
    scrollToTop();
  };

  return {
    t,
    locale,
    isLoaded,
    cartItems,
    totals,
    discount,
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
    submitPayment,
    orderId,
    isPlacing,
    placeOrder,
    placedOrder,
  };
}
export default useCheckout;
