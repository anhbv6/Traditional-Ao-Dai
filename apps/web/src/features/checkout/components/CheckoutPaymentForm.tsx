import React from "react";
import { CreditCard, ArrowLeft, ArrowRight } from "lucide-react";
import { type PaymentData } from "../types/checkout.types";

interface CheckoutPaymentFormProps {
  payment: PaymentData;
  setPayment: React.Dispatch<React.SetStateAction<PaymentData>>;
  paymentErrors: Partial<PaymentData>;
  handlePrevStep: () => void;
  handleNextStep: () => void;
}

export function CheckoutPaymentForm({
  payment,
  setPayment,
  paymentErrors,
  handlePrevStep,
  handleNextStep,
}: CheckoutPaymentFormProps) {
  return (
    <div className="rounded-2xl border border-[var(--primary-color)]/10 bg-[var(--bg-card)] p-5 sm:p-6 shadow-xs animate-fade-in">
      <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--primary-ink)] border-b border-[var(--border)]/60 pb-3 flex items-center gap-2">
        <CreditCard size={18} />
        Phương Thức Thanh Toán
      </h2>

      <div className="mt-6 flex flex-col gap-4">
        {/* Method Radios list */}
        <div className="flex flex-col gap-3">
          {/* COD */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            payment.method === "cod" ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5" : "border-[var(--border)]/60 hover:border-[var(--primary-color)]/25 bg-[var(--bg-main)]/30"
          }`}>
            <input
              type="radio"
              name="payment_method"
              value="cod"
              checked={payment.method === "cod"}
              onChange={() => setPayment(prev => ({ ...prev, method: "cod" }))}
              className="mt-1 accent-[var(--primary-color)]"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Thanh toán khi nhận hàng (COD)</p>
              <p className="text-[10px] text-[var(--text-light)] mt-1">
                Thanh toán tiền mặt cho nhân viên giao hàng sau khi nhận và kiểm tra áo dài.
              </p>
            </div>
          </label>

          {/* Bank Transfer */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            payment.method === "bank" ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5" : "border-[var(--border)]/60 hover:border-[var(--primary-color)]/25 bg-[var(--bg-main)]/30"
          }`}>
            <input
              type="radio"
              name="payment_method"
              value="bank"
              checked={payment.method === "bank"}
              onChange={() => setPayment(prev => ({ ...prev, method: "bank" }))}
              className="mt-1 accent-[var(--primary-color)]"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Chuyển khoản ngân hàng</p>
              <p className="text-[10px] text-[var(--text-light)] mt-1">
                Chuyển tiền vào tài khoản ngân hàng của chúng tôi. Thông tin tài khoản sẽ hiển thị ở bước review tiếp theo.
              </p>
            </div>
          </label>

          {/* Credit Card */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            payment.method === "card" ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5" : "border-[var(--border)]/60 hover:border-[var(--primary-color)]/25 bg-[var(--bg-main)]/30"
          }`}>
            <input
              type="radio"
              name="payment_method"
              value="card"
              checked={payment.method === "card"}
              onChange={() => setPayment(prev => ({ ...prev, method: "card" }))}
              className="mt-1 accent-[var(--primary-color)]"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Thẻ tín dụng / ghi nợ (Credit Card)</p>
              <p className="text-[10px] text-[var(--text-light)] mt-1">
                Hỗ trợ Visa, Mastercard, JCB, thẻ nội địa. Nhập thông tin thẻ ở bên dưới.
              </p>
            </div>
          </label>
        </div>

        {/* Optional Credit Card Details Form */}
        {payment.method === "card" && (
          <div className="mt-4 p-5 rounded-2xl border border-[var(--primary-color)]/15 bg-[var(--bg-main)]/50 flex flex-col gap-4 animate-scale-up">
            <h3 className="text-xs font-bold text-[var(--primary-ink)] uppercase tracking-wider border-b border-[var(--border)]/40 pb-2">
              Nhập thông tin thẻ của bạn
            </h3>

            {/* Cardholder name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
                Tên trên thẻ
              </label>
              <input
                type="text"
                placeholder="NGUYEN VAN A"
                value={payment.cardHolder}
                onChange={(e) => setPayment(prev => ({ ...prev, cardHolder: e.target.value.toUpperCase() }))}
                className="w-full h-10 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors"
              />
              {paymentErrors.cardHolder && <p className="text-[10px] text-rose-500">✕ {paymentErrors.cardHolder}</p>}
            </div>

            {/* Card Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
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
                className="w-full h-10 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors font-mono"
              />
              {paymentErrors.cardNumber && <p className="text-[10px] text-rose-500">✕ {paymentErrors.cardNumber}</p>}
            </div>

            {/* Expiry & CVV */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
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
                  className="w-full h-10 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors"
                />
                {paymentErrors.cardExpiry && <p className="text-[10px] text-rose-500">✕ {paymentErrors.cardExpiry}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
                  Mã CVV
                </label>
                <input
                  type="password"
                  placeholder="•••"
                  maxLength={4}
                  value={payment.cardCvv}
                  onChange={(e) => setPayment(prev => ({ ...prev, cardCvv: e.target.value.replace(/\D/g, "") }))}
                  className="w-full h-10 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors"
                />
                {paymentErrors.cardCvv && <p className="text-[10px] text-rose-500">✕ {paymentErrors.cardCvv}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between border-t border-[var(--border)]/40 pt-4">
        <button
          type="button"
          onClick={handlePrevStep}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-5 text-xs font-semibold uppercase tracking-wider text-[var(--text-light)] transition-all hover:bg-gray-50 cursor-pointer active:scale-95 duration-200"
        >
          <ArrowLeft size={14} />
          Quay Lại
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[var(--primary-color)] px-6 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[var(--primary-color)]/90 cursor-pointer active:scale-95 duration-200"
        >
          Tiếp Tục Xác Nhận
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
export default CheckoutPaymentForm;
