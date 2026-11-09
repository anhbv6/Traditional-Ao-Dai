"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useLenis } from "lenis/react";
import { type Locale } from "@repo/shared";
import {
  DEPOSIT_PERCENT_DEFAULT,
  computePrepayAmount,
  isPaymentMethodAllowed,
  type PaymentMethod,
} from "@repo/shared/orders";
import { calculateCartTotals, useCartHydrated, useCartStore } from "@/features/cart";
import { clearMeasurementDraft } from "@/features/bespoke";
import { placeOrderApi, type PlaceOrderPayload } from "@/features/orders";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { shippingSchema } from "../validations/checkout.validation";
import { CHECKOUT_STEPS, type CartItem, type CheckoutStep, type ShippingData, type ShippingFormInput } from "../types/checkout.types";

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

/** Dòng giỏ → dòng gửi API. Chỉ gửi định danh + số đo; giá do server tính lại */
function toOrderLine(item: CartItem): PlaceOrderPayload["items"][number] {
  return {
    productSlug: item.slug,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    measurements: item.measurementValues && Object.keys(item.measurementValues).length > 0 ? item.measurementValues : undefined,
    bespoke: item.bespoke,
  };
}

/**
 * Luồng thanh toán 3 bước: Giao hàng → Thanh toán → Xác nhận → trang cảm ơn.
 * - Đơn có món may đo: KHÔNG có COD 100% — chọn cọc 30–50% (còn lại COD) hoặc chuyển khoản toàn bộ qua VietQR.
 * - Tiền hiển thị ở client chỉ để xem trước; API tính lại toàn bộ khi đặt. Mã giảm giá demo của giỏ không được áp khi đặt online.
 * - Đặt xong: xoá giỏ + nháp số đo rồi chuyển sang `/checkout/thank-you?token=…` (F5 vẫn xem lại được đơn).
 */
export function useCheckout() {
  const t = useTranslations("CheckoutPage");
  const locale = useLocale() as Locale;
  const lenis = useLenis();
  const router = useRouter();
  const notify = useNotify();
  const cartItems = useCartStore((state) => state.items);
  const cartDiscount = useCartStore((state) => state.discount);
  const isLoaded = useCartHydrated();

  const [step, setStep] = useState<CheckoutStep>("shipping");
  /** Bước xa nhất đã mở khoá — các bước trước đó bấm quay lại được trên thanh tiến trình */
  const [maxStepIndex, setMaxStepIndex] = useState(0);
  /** Hướng đổi bước gần nhất: 1 = tiến, -1 = lùi — khung bước trượt vào từ phía tương ứng */
  const [direction, setDirection] = useState<1 | -1>(1);
  const [shipping, setShipping] = useState<ShippingData | null>(null);
  const [selectedMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [depositPercent, setDepositPercent] = useState(DEPOSIT_PERCENT_DEFAULT);

  const shippingForm = useForm<ShippingFormInput, unknown, ShippingData>({
    resolver: zodResolver(shippingSchema),
    /* Kiểm tra khi rời ô lần đầu, sau đó kiểm tra lại theo từng lần gõ */
    mode: "onTouched",
    defaultValues: EMPTY_SHIPPING,
  });

  // Không áp mã giảm giá demo: số tiền xem trước phải khớp số server tính
  const totals = calculateCartTotals(cartItems, null);
  const hasCustomItems = cartItems.some((item) => Boolean(item.measurements || item.bespoke));
  // Đơn may đo mà đang chọn COD (VD vừa thêm món may đo) → tự chuyển sang cọc, không lưu state thừa
  const paymentMethod: PaymentMethod = isPaymentMethodAllowed(selectedMethod, hasCustomItems)
    ? selectedMethod === "DEPOSIT" && !hasCustomItems
      ? "COD"
      : selectedMethod
    : "DEPOSIT";
  const prepayAmount = computePrepayAmount(totals.total, paymentMethod, depositPercent);

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

  const submitPayment = () => unlockAndGo("review");

  const placeMutation = useMutation({
    mutationFn: (data: ShippingData) =>
      placeOrderApi({
        customer: { fullName: data.fullName, phone: data.phone, email: data.email },
        shipping: { province: data.province, district: data.district, ward: data.ward, addressLine: data.address },
        note: data.notes || undefined,
        items: cartItems.map(toOrderLine),
        paymentMethod,
        depositPercent: paymentMethod === "DEPOSIT" ? depositPercent : undefined,
        locale,
      }),
    onSuccess: ({ accessToken }) => {
      useCartStore.getState().clear();
      clearMeasurementDraft();
      router.replace({ pathname: "/checkout/thank-you", query: { token: accessToken } });
    },
    onError: (error) => notify.error(error, "ORDER_CREATE_FAILED"),
  });

  const placeOrder = () => {
    if (!shipping || placeMutation.isPending || placeMutation.isSuccess) return;
    placeMutation.mutate(shipping);
  };

  return {
    t,
    locale,
    isLoaded,
    cartItems,
    totals,
    hasCartDiscount: cartDiscount !== null,
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
    isPlacing: placeMutation.isPending || placeMutation.isSuccess,
    placeOrder,
  };
}
export default useCheckout;
