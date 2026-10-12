import React from "react";
import { MapPin, ArrowRight } from "lucide-react";
import { type ShippingData } from "../types/checkout.types";

interface CheckoutShippingFormProps {
  shipping: ShippingData;
  setShipping: React.Dispatch<React.SetStateAction<ShippingData>>;
  shippingErrors: Partial<ShippingData>;
  handleNextStep: () => void;
}

export function CheckoutShippingForm({
  shipping,
  setShipping,
  shippingErrors,
  handleNextStep,
}: CheckoutShippingFormProps) {
  return (
    <div className="rounded-2xl border border-[var(--primary-color)]/10 bg-[var(--bg-card)] p-5 sm:p-6 shadow-xs animate-fade-in">
      <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[var(--primary-ink)] border-b border-[var(--border)]/60 pb-3 flex items-center gap-2">
        <MapPin size={18} />
        Thông Tin Giao Hàng
      </h2>
      
      <div className="mt-6 flex flex-col gap-4">
        {/* Full name & Phone */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-light)]">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              value={shipping.fullName}
              onChange={(e) => setShipping(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full h-10 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-main)] focus:bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors"
            />
            {shippingErrors.fullName && <p className="text-[10px] text-rose-500">✕ {shippingErrors.fullName}</p>}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-light)]">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="0901234567"
              value={shipping.phone}
              onChange={(e) => setShipping(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full h-10 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-main)] focus:bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors"
            />
            {shippingErrors.phone && <p className="text-[10px] text-rose-500">✕ {shippingErrors.phone}</p>}
          </div>
        </div>

        {/* Email address */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-light)]">
            Địa chỉ email <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            placeholder="nguyenvana@gmail.com"
            value={shipping.email}
            onChange={(e) => setShipping(prev => ({ ...prev, email: e.target.value }))}
            className="w-full h-10 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-main)] focus:bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors"
          />
          {shippingErrors.email && <p className="text-[10px] text-rose-500">✕ {shippingErrors.email}</p>}
        </div>

        {/* Province / District / Ward */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-light)]">
              Tỉnh / Thành phố <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Hà Nội"
              value={shipping.province}
              onChange={(e) => setShipping(prev => ({ ...prev, province: e.target.value }))}
              className="w-full h-10 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-main)] focus:bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors"
            />
            {shippingErrors.province && <p className="text-[10px] text-rose-500">✕ {shippingErrors.province}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-light)]">
              Quận / Huyện <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Cầu Giấy"
              value={shipping.district}
              onChange={(e) => setShipping(prev => ({ ...prev, district: e.target.value }))}
              className="w-full h-10 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-main)] focus:bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors"
            />
            {shippingErrors.district && <p className="text-[10px] text-rose-500">✕ {shippingErrors.district}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-light)]">
              Phường / Xã <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Dịch Vọng"
              value={shipping.ward}
              onChange={(e) => setShipping(prev => ({ ...prev, ward: e.target.value }))}
              className="w-full h-10 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-main)] focus:bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors"
            />
            {shippingErrors.ward && <p className="text-[10px] text-rose-500">✕ {shippingErrors.ward}</p>}
          </div>
        </div>

        {/* Specific address */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-light)]">
            Địa chỉ chi tiết <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Số 10, ngõ 100 Trần Thái Tông"
            value={shipping.address}
            onChange={(e) => setShipping(prev => ({ ...prev, address: e.target.value }))}
            className="w-full h-10 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-main)] focus:bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors"
          />
          {shippingErrors.address && <p className="text-[10px] text-rose-500">✕ {shippingErrors.address}</p>}
        </div>

        {/* Order notes */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-light)]">
            Ghi chú đơn hàng (Tùy chọn)
          </label>
          <textarea
            placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
            value={shipping.notes}
            onChange={(e) => setShipping(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full py-2.5 rounded-lg border border-[var(--border)] px-3 text-xs bg-[var(--bg-main)] focus:bg-[var(--bg-card)] focus:border-[var(--primary-color)]/50 outline-none text-[var(--text-main)] transition-colors resize-none"
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleNextStep}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[var(--primary-color)] px-6 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[var(--primary-color)]/90 cursor-pointer active:scale-95 duration-200"
        >
          Tiếp Tục Thanh Toán
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
export default CheckoutShippingForm;
