"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Check, CreditCard, MapPin, Truck, ArrowRight, ArrowLeft, ShoppingBag, Shield } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";

type CartItem = {
  id: number;
  name: string;
  slug: string;
  image: string;
  quantity: number;
  price: number;
  size: string;
};

type ShippingData = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  notes: string;
};

type PaymentData = {
  method: "cod" | "bank" | "card";
  cardHolder: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
};

export function CheckoutPageClient() {
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

  if (!isLoaded) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-[#800020] border-t-transparent" />
      </div>
    );
  }

  // MÀN HÌNH ĐẶT HÀNG THÀNH CÔNG (STEP 4)
  if (step === 4) {
    return (
      <div className="max-w-xl mx-auto mt-12 py-16 px-6 text-center bg-[#FAF7F5] border border-[#E2D9D2]/40 rounded-2xl animate-scale-up shadow-sm">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm animate-bounce">
          <Check size={36} />
        </div>
        <h1 className="mt-8 font-[family-name:var(--font-playfair)] text-3xl font-extrabold text-[#800020]">
          Đặt Hàng Thành Công!
        </h1>
        <p className="mt-3 text-sm text-[#706565]">
          Cảm ơn bạn đã mua sắm tại <strong>Traditional Ao Dai shop</strong>. Đơn hàng của bạn đã được nhận và đang được xử lý.
        </p>
        
        <div className="mt-6 p-4 bg-white rounded-xl border border-[#E2D9D2]/40 inline-block">
          <p className="text-xs text-[#706565]">Mã đơn hàng của bạn</p>
          <p className="text-lg font-mono font-extrabold text-[#800020] tracking-wider mt-1">
            {orderId}
          </p>
        </div>

        <p className="mt-6 text-xs text-[#706565]/80">
          Chúng tôi đã gửi email xác nhận chi tiết đơn hàng đến địa chỉ <strong className="text-[#2A2525]">{shipping.email}</strong>.
        </p>

        <div className="mt-8 pt-6 border-t border-[#E2D9D2]/60">
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#800020] px-8 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#800020]/90 cursor-pointer active:scale-95 duration-200"
          >
            Tiếp Tục Mua Sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 animate-fade-in font-[family-name:var(--font-lora)] text-[var(--text-main)]">
      {/* 3-STEP PROGRESS STEPPER */}
      <div className="max-w-xl mx-auto mb-10">
        <div className="flex items-center justify-between relative select-none">
          {/* Stepper Line Background */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#E2D9D2]/60 -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#800020] -z-10 transition-all duration-500" 
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />

          {/* Step 1 */}
          <div className="flex flex-col items-center bg-[#FAF7F5] px-2">
            <div className={`flex size-9 items-center justify-center rounded-full border-2 font-bold text-xs transition-all duration-300 ${
              step > 1 ? "bg-[#800020] border-[#800020] text-white" : step === 1 ? "bg-white border-[#800020] text-[#800020] shadow-xs" : "bg-white border-[#E2D9D2] text-[#706565]"
            }`}>
              {step > 1 ? <Check size={14} /> : "1"}
            </div>
            <span className={`mt-2 text-[10px] uppercase font-bold tracking-wider ${step === 1 ? "text-[#800020]" : "text-[#706565]"}`}>
              Giao hàng
            </span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center bg-[#FAF7F5] px-2">
            <div className={`flex size-9 items-center justify-center rounded-full border-2 font-bold text-xs transition-all duration-300 ${
              step > 2 ? "bg-[#800020] border-[#800020] text-white" : step === 2 ? "bg-white border-[#800020] text-[#800020] shadow-xs" : "bg-white border-[#E2D9D2] text-[#706565]"
            }`}>
              {step > 2 ? <Check size={14} /> : "2"}
            </div>
            <span className={`mt-2 text-[10px] uppercase font-bold tracking-wider ${step === 2 ? "text-[#800020]" : "text-[#706565]"}`}>
              Thanh toán
            </span>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center bg-[#FAF7F5] px-2">
            <div className={`flex size-9 items-center justify-center rounded-full border-2 font-bold text-xs transition-all duration-300 ${
              step === 3 ? "bg-white border-[#800020] text-[#800020] shadow-xs" : "bg-white border-[#E2D9D2] text-[#706565]"
            }`}>
              "3"
            </div>
            <span className={`mt-2 text-[10px] uppercase font-bold tracking-wider ${step === 3 ? "text-[#800020]" : "text-[#706565]"}`}>
              Xác nhận
            </span>
          </div>
        </div>
      </div>

      {/* CHECKOUT CONTAINER WITH 2 COLS */}
      <div className="grid gap-8 lg:grid-cols-3 items-start mt-8">
        {/* LEFT COLUMN: ACTIVE STEP FORM */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: SHIPPING FORM */}
          {step === 1 && (
            <div className="rounded-2xl border border-[#800020]/10 bg-white p-5 sm:p-6 shadow-xs animate-fade-in">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020] border-b border-[#E2D9D2]/60 pb-3 flex items-center gap-2">
                <MapPin size={18} />
                Thông Tin Giao Hàng
              </h2>
              
              <div className="mt-6 flex flex-col gap-4">
                {/* Full name & Phone */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#706565]">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={shipping.fullName}
                      onChange={(e) => setShipping(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-[#FAF7F5] focus:bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors"
                    />
                    {shippingErrors.fullName && <p className="text-[10px] text-rose-500">✕ {shippingErrors.fullName}</p>}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#706565]">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0901234567"
                      value={shipping.phone}
                      onChange={(e) => setShipping(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-[#FAF7F5] focus:bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors"
                    />
                    {shippingErrors.phone && <p className="text-[10px] text-rose-500">✕ {shippingErrors.phone}</p>}
                  </div>
                </div>

                {/* Email address */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#706565]">
                    Địa chỉ email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="nguyenvana@gmail.com"
                    value={shipping.email}
                    onChange={(e) => setShipping(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-[#FAF7F5] focus:bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors"
                  />
                  {shippingErrors.email && <p className="text-[10px] text-rose-500">✕ {shippingErrors.email}</p>}
                </div>

                {/* Province / District / Ward */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#706565]">
                      Tỉnh / Thành phố <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Hà Nội"
                      value={shipping.province}
                      onChange={(e) => setShipping(prev => ({ ...prev, province: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-[#FAF7F5] focus:bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors"
                    />
                    {shippingErrors.province && <p className="text-[10px] text-rose-500">✕ {shippingErrors.province}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#706565]">
                      Quận / Huyện <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Cầu Giấy"
                      value={shipping.district}
                      onChange={(e) => setShipping(prev => ({ ...prev, district: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-[#FAF7F5] focus:bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors"
                    />
                    {shippingErrors.district && <p className="text-[10px] text-rose-500">✕ {shippingErrors.district}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#706565]">
                      Phường / Xã <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Dịch Vọng"
                      value={shipping.ward}
                      onChange={(e) => setShipping(prev => ({ ...prev, ward: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-[#FAF7F5] focus:bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors"
                    />
                    {shippingErrors.ward && <p className="text-[10px] text-rose-500">✕ {shippingErrors.ward}</p>}
                  </div>
                </div>

                {/* Specific address */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#706565]">
                    Địa chỉ chi tiết <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Số 10, ngõ 100 Trần Thái Tông"
                    value={shipping.address}
                    onChange={(e) => setShipping(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-[#FAF7F5] focus:bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors"
                  />
                  {shippingErrors.address && <p className="text-[10px] text-rose-500">✕ {shippingErrors.address}</p>}
                </div>

                {/* Order notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#706565]">
                    Ghi chú đơn hàng (Tùy chọn)
                  </label>
                  <textarea
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                    value={shipping.notes}
                    onChange={(e) => setShipping(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full py-2.5 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-[#FAF7F5] focus:bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#800020] px-6 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#800020]/90 cursor-pointer active:scale-95 duration-200"
                >
                  Tiếp Tục Thanh Toán
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 2 && (
            <div className="rounded-2xl border border-[#800020]/10 bg-white p-5 sm:p-6 shadow-xs animate-fade-in">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020] border-b border-[#E2D9D2]/60 pb-3 flex items-center gap-2">
                <CreditCard size={18} />
                Phương Thức Thanh Toán
              </h2>

              <div className="mt-6 flex flex-col gap-4">
                {/* Method Radios list */}
                <div className="flex flex-col gap-3">
                  {/* COD */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    payment.method === "cod" ? "border-[#800020] bg-[#800020]/5" : "border-[#E2D9D2]/60 hover:border-[#800020]/25 bg-[#FAF7F5]/30"
                  }`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={payment.method === "cod"}
                      onChange={() => setPayment(prev => ({ ...prev, method: "cod" }))}
                      className="mt-1 accent-[#800020]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#2A2525] uppercase tracking-wider">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-[10px] text-[#706565] mt-1">
                        Thanh toán tiền mặt cho nhân viên giao hàng sau khi nhận và kiểm tra áo dài.
                      </p>
                    </div>
                  </label>

                  {/* Bank Transfer */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    payment.method === "bank" ? "border-[#800020] bg-[#800020]/5" : "border-[#E2D9D2]/60 hover:border-[#800020]/25 bg-[#FAF7F5]/30"
                  }`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="bank"
                      checked={payment.method === "bank"}
                      onChange={() => setPayment(prev => ({ ...prev, method: "bank" }))}
                      className="mt-1 accent-[#800020]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#2A2525] uppercase tracking-wider">Chuyển khoản ngân hàng</p>
                      <p className="text-[10px] text-[#706565] mt-1">
                        Chuyển tiền vào tài khoản ngân hàng của chúng tôi. Thông tin tài khoản sẽ hiển thị ở bước review tiếp theo.
                      </p>
                    </div>
                  </label>

                  {/* Credit Card */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    payment.method === "card" ? "border-[#800020] bg-[#800020]/5" : "border-[#E2D9D2]/60 hover:border-[#800020]/25 bg-[#FAF7F5]/30"
                  }`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={payment.method === "card"}
                      onChange={() => setPayment(prev => ({ ...prev, method: "card" }))}
                      className="mt-1 accent-[#800020]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#2A2525] uppercase tracking-wider">Thẻ tín dụng / ghi nợ (Credit Card)</p>
                      <p className="text-[10px] text-[#706565] mt-1">
                        Hỗ trợ Visa, Mastercard, JCB, thẻ nội địa. Nhập thông tin thẻ ở bên dưới.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Optional Credit Card Details Form */}
                {payment.method === "card" && (
                  <div className="mt-4 p-5 rounded-2xl border border-[#800020]/15 bg-[#FAF7F5]/50 flex flex-col gap-4 animate-scale-up">
                    <h3 className="text-xs font-bold text-[#800020] uppercase tracking-wider border-b border-[#E2D9D2]/40 pb-2">
                      Nhập thông tin thẻ của bạn
                    </h3>

                    {/* Cardholder name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#706565]">
                        Tên trên thẻ
                      </label>
                      <input
                        type="text"
                        placeholder="NGUYEN VAN A"
                        value={payment.cardHolder}
                        onChange={(e) => setPayment(prev => ({ ...prev, cardHolder: e.target.value.toUpperCase() }))}
                        className="w-full h-10 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors"
                      />
                      {paymentErrors.cardHolder && <p className="text-[10px] text-rose-500">✕ {paymentErrors.cardHolder}</p>}
                    </div>

                    {/* Card Number */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#706565]">
                        Số thẻ
                      </label>
                      <input
                        type="text"
                        placeholder="4123 4567 8901 2345"
                        maxLength={19}
                        value={payment.cardNumber}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
                          setPayment(prev => ({ ...prev, cardNumber: formatted }));
                        }}
                        className="w-full h-10 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors font-mono"
                      />
                      {paymentErrors.cardNumber && <p className="text-[10px] text-rose-500">✕ {paymentErrors.cardNumber}</p>}
                    </div>

                    {/* Expiry & CVV */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#706565]">
                          Ngày hết hạn (MM/YY)
                        </label>
                        <input
                          type="text"
                          placeholder="12/29"
                          maxLength={5}
                          value={payment.cardExpiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length > 2) {
                              value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
                            }
                            setPayment(prev => ({ ...prev, cardExpiry: value }));
                          }}
                          className="w-full h-10 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors"
                        />
                        {paymentErrors.cardExpiry && <p className="text-[10px] text-rose-500">✕ {paymentErrors.cardExpiry}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#706565]">
                          Mã CVV
                        </label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={4}
                          value={payment.cardCvv}
                          onChange={(e) => setPayment(prev => ({ ...prev, cardCvv: e.target.value.replace(/\D/g, "") }))}
                          className="w-full h-10 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-white focus:border-[#800020]/50 outline-none text-[#2A2525] transition-colors"
                        />
                        {paymentErrors.cardCvv && <p className="text-[10px] text-rose-500">✕ {paymentErrors.cardCvv}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-between border-t border-[#E2D9D2]/40 pt-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E2D9D2] bg-white px-5 text-xs font-semibold uppercase tracking-wider text-[#706565] transition-all hover:bg-gray-50 cursor-pointer active:scale-95 duration-200"
                >
                  <ArrowLeft size={14} />
                  Quay Lại
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#800020] px-6 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#800020]/90 cursor-pointer active:scale-95 duration-200"
                >
                  Tiếp Tục Xác Nhận
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & CONFIRM */}
          {step === 3 && (
            <div className="rounded-2xl border border-[#800020]/10 bg-white p-5 sm:p-6 shadow-xs animate-fade-in space-y-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020] border-b border-[#E2D9D2]/60 pb-3 flex items-center gap-2">
                <Shield size={18} />
                Xác Nhận Thông Tin Đơn Hàng
              </h2>

              {/* Summary Cards */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Shipping Summary */}
                <div className="p-4 rounded-xl border border-[#E2D9D2]/50 bg-[#FAF7F5]/30">
                  <h3 className="text-xs font-bold text-[#800020] uppercase tracking-wider border-b border-[#E2D9D2]/30 pb-2">
                    Địa chỉ nhận hàng
                  </h3>
                  <div className="mt-2 text-xs text-[#2A2525] space-y-1">
                    <p className="font-semibold text-sm">{shipping.fullName}</p>
                    <p>{shipping.phone}</p>
                    <p className="text-[#706565]">{shipping.email}</p>
                    <p className="mt-2 text-[#2A2525]/80 font-medium">
                      {shipping.address}, {shipping.ward}, {shipping.district}, {shipping.province}
                    </p>
                    {shipping.notes && (
                      <p className="mt-3 text-[11px] italic text-[#706565] border-t border-[#E2D9D2]/20 pt-1.5">
                        Ghi chú: {shipping.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="p-4 rounded-xl border border-[#E2D9D2]/50 bg-[#FAF7F5]/30 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#800020] uppercase tracking-wider border-b border-[#E2D9D2]/30 pb-2">
                      Phương thức thanh toán
                    </h3>
                    <div className="mt-3 text-xs text-[#2A2525]">
                      {payment.method === "cod" && (
                        <div>
                          <p className="font-bold text-xs uppercase tracking-wider text-[#800020]">Thanh toán khi nhận hàng (COD)</p>
                          <p className="text-[10px] text-[#706565] mt-1 leading-relaxed">
                            Khách hàng sẽ thanh toán tiền mặt trực tiếp cho bên vận chuyển sau khi nhận và kiểm hàng.
                          </p>
                        </div>
                      )}
                      {payment.method === "bank" && (
                        <div className="space-y-1">
                          <p className="font-bold text-xs uppercase tracking-wider text-[#800020]">Chuyển khoản ngân hàng</p>
                          <div className="bg-white p-2.5 rounded-lg border border-[#E2D9D2]/30 mt-2 space-y-1 text-[11px] text-[#706565]">
                            <p>Ngân hàng: <strong>Techcombank</strong></p>
                            <p>Số tài khoản: <strong>19034567891011</strong></p>
                            <p>Chủ TK: <strong>CONG TY AO DAI SAC VIET</strong></p>
                            <p className="italic text-[10px] text-rose-500 pt-1">Nội dung CK: Tên Khách Hàng - Số điện thoại</p>
                          </div>
                        </div>
                      )}
                      {payment.method === "card" && (
                        <div>
                          <p className="font-bold text-xs uppercase tracking-wider text-[#800020]">Thẻ tín dụng / ghi nợ</p>
                          <div className="flex items-center gap-2.5 mt-2.5 p-2 bg-white rounded-lg border border-[#E2D9D2]/30">
                            <CreditCard size={18} className="text-[#800020]" />
                            <div>
                              <p className="font-mono text-xs text-[#2A2525] font-semibold">
                                •••• •••• •••• {payment.cardNumber.slice(-4)}
                              </p>
                              <p className="text-[10px] text-[#706565] uppercase mt-0.5">
                                {payment.cardHolder}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security trust note */}
              <div className="flex gap-2.5 items-start bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg text-[10px] text-emerald-800">
                <Shield size={14} className="shrink-0 text-emerald-600 mt-0.5" />
                <p>
                  Đơn hàng của bạn được bảo mật hoàn toàn bởi hệ thống bảo mật SSL của chúng tôi. Bằng cách nhấp vào "Đặt hàng ngay", bạn đồng ý với các chính sách mua hàng và điều khoản dịch vụ.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-between border-t border-[#E2D9D2]/40 pt-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E2D9D2] bg-white px-5 text-xs font-semibold uppercase tracking-wider text-[#706565] transition-all hover:bg-gray-50 cursor-pointer active:scale-95 duration-200"
                >
                  <ArrowLeft size={14} />
                  Quay Lại
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#800020] px-6 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#800020]/90 cursor-pointer active:scale-95 duration-200"
                >
                  <Check size={14} />
                  Đặt Hàng Ngay
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[#800020]/10 bg-[#FAF7F5] p-5 shadow-xs">
            <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[#800020] border-b border-[#E2D9D2]/60 pb-3">
              Tóm tắt đơn hàng
            </h3>

            {/* List items scrollable preview */}
            <div className="mt-4 max-h-[220px] overflow-y-auto divide-y divide-[#E2D9D2]/30 pr-1">
              {cartItems.length === 0 ? (
                <p className="text-xs text-[#706565] py-4 text-center">Không có sản phẩm nào trong giỏ hàng</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-white border border-[#E2D9D2]/30">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#800020] line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="mt-0.5 text-[10px] text-[#706565]">
                        Kích cỡ: {item.size} • SL: {item.quantity}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#2A2525]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pricing details */}
            <div className="mt-4 pt-3 border-t border-[#E2D9D2]/60 space-y-2.5 text-xs text-[#706565]">
              <div className="flex items-center justify-between">
                <span>Tạm tính</span>
                <span className="font-semibold text-[#2A2525]">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Phí vận chuyển</span>
                {shippingCost === 0 ? (
                  <span className="text-emerald-600 font-semibold">Miễn phí</span>
                ) : (
                  <span className="font-semibold text-[#2A2525]">${shippingCost.toFixed(2)}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span>Thuế VAT (8%)</span>
                <span className="font-semibold text-[#2A2525]">${tax.toFixed(2)}</span>
              </div>

              <div className="border-t border-[#E2D9D2]/60 pt-3 flex items-end justify-between">
                <span className="text-sm font-bold text-[#2A2525]">Tổng thanh toán</span>
                <span className="text-base font-extrabold text-[#800020]">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
