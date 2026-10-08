import React from "react";
import { Shield, CreditCard, ArrowLeft, Check } from "lucide-react";
import { type ShippingData, type PaymentData } from "../types/checkout.types";

interface CheckoutReviewProps {
  shipping: ShippingData;
  payment: PaymentData;
  handlePrevStep: () => void;
  handlePlaceOrder: () => void;
}

export function CheckoutReview({
  shipping,
  payment,
  handlePrevStep,
  handlePlaceOrder,
}: CheckoutReviewProps) {
  return (
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
          Đơn hàng của bạn được bảo mật hoàn toàn bởi hệ thống bảo mật SSL của chúng tôi. Bằng cách nhấp vào &ldquo;Đặt hàng ngay&rdquo;, bạn đồng ý với các chính sách mua hàng và điều khoản dịch vụ.
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
  );
}
export default CheckoutReview;
