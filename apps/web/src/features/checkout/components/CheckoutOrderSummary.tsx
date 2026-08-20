import React from "react";
import Image from "next/image";
import { type CartItem } from "../types/checkout.types";

interface CheckoutOrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

export function CheckoutOrderSummary({
  cartItems,
  subtotal,
  shippingCost,
  tax,
  total,
}: CheckoutOrderSummaryProps) {
  return (
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
  );
}
export default CheckoutOrderSummary;
