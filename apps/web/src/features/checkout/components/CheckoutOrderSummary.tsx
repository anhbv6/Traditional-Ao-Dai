import React from "react";
import Image from "next/image";
import { formatVnd } from "@repo/shared";
import { type CartItem } from "../types/checkout.types";

interface CheckoutOrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}

export function CheckoutOrderSummary({
  cartItems,
  subtotal,
  shippingCost,
  total,
}: CheckoutOrderSummaryProps) {
  return (
    <div className="rounded-2xl border border-[var(--primary-color)]/10 bg-[var(--bg-main)] p-5 shadow-xs">
      <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[var(--primary-ink)] border-b border-[var(--border)]/60 pb-3">
        Tóm tắt đơn hàng
      </h3>

      {/* List items scrollable preview */}
      <div className="mt-4 max-h-[220px] overflow-y-auto divide-y divide-[var(--border)]/30 pr-1">
        {cartItems.length === 0 ? (
          <p className="text-xs text-[var(--text-light)] py-4 text-center">Không có sản phẩm nào trong giỏ hàng</p>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-card)] border border-[var(--border)]/30">
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
                <h4 className="text-xs font-bold text-[var(--primary-ink)] line-clamp-1">
                  {item.name}
                </h4>
                <p className="mt-0.5 text-[10px] text-[var(--text-light)]">
                  Kích cỡ: {item.size} • SL: {item.quantity}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--text-main)]">
                  {formatVnd(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pricing details */}
      <div className="mt-4 pt-3 border-t border-[var(--border)]/60 space-y-2.5 text-xs text-[var(--text-light)]">
        <div className="flex items-center justify-between">
          <span>Tạm tính</span>
          <span className="font-semibold text-[var(--text-main)]">{formatVnd(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Phí vận chuyển</span>
          {shippingCost === 0 ? (
            <span className="text-emerald-600 font-semibold">Miễn phí</span>
          ) : (
            <span className="font-semibold text-[var(--text-main)]">{formatVnd(shippingCost)}</span>
          )}
        </div>

        <div className="border-t border-[var(--border)]/60 pt-3 flex items-end justify-between">
          <span className="text-sm font-bold text-[var(--text-main)]">Tổng thanh toán</span>
          <span className="text-base font-extrabold text-[var(--primary-ink)]">{formatVnd(total)}</span>
        </div>
      </div>
    </div>
  );
}
export default CheckoutOrderSummary;
