import React from "react";
import { formatVnd } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { type ActiveDiscount } from "../types/cart.types";

interface CartSummaryProps {
  subtotal: number;
  activeDiscount: ActiveDiscount | null;
  discountAmount: number;
  shippingCost: number;
  shippingThreshold: number;
  total: number;
}

export function CartSummary({
  subtotal,
  activeDiscount,
  discountAmount,
  shippingCost,
  shippingThreshold,
  total,
}: CartSummaryProps) {
  return (
    <div className="rounded-2xl border border-[#800020]/10 bg-[#FAF7F5] p-5 shadow-xs">
      <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[#800020] border-b border-[#E2D9D2]/60 pb-3">
        Tóm tắt đơn hàng
      </h3>

      <div className="mt-4 space-y-3 text-xs text-[#706565]">
        <div className="flex items-center justify-between">
          <span>Tạm tính</span>
          <span className="font-semibold text-[#2A2525]">{formatVnd(subtotal)}</span>
        </div>

        {activeDiscount && (
          <div className="flex items-center justify-between text-emerald-600 font-medium">
            <span>Mã giảm giá ({activeDiscount.code})</span>
            {activeDiscount.type === "percentage" ? (
              <span>-{formatVnd(discountAmount)}</span>
            ) : (
              <span>Freeship</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>Phí vận chuyển</span>
          {shippingCost === 0 ? (
            <span className="text-emerald-600 font-semibold">Miễn phí</span>
          ) : (
            <span className="font-semibold text-[#2A2525]">{formatVnd(shippingCost)}</span>
          )}
        </div>


        <div className="border-t border-[#E2D9D2]/60 pt-3 flex items-end justify-between">
          <span className="text-sm font-bold text-[#2A2525]">
            Tổng cộng <span className="block text-[10px] font-normal text-[#706565]">(Đã bao gồm VAT)</span>
          </span>
          <span className="text-lg font-extrabold text-[#800020]">{formatVnd(total)}</span>
        </div>
      </div>

      {/* Free shipping progress indicator */}
      {shippingCost > 0 && (
        <div className="mt-4 p-3 bg-white border border-[#E2D9D2]/30 rounded-lg text-[10px] text-[#706565]">
          <p>
            Mua thêm <span className="font-bold text-[#800020]">{formatVnd(shippingThreshold - subtotal)}</span> để được <strong>Miễn phí vận chuyển</strong>!
          </p>
          <div className="mt-2 w-full h-1.5 bg-[#FAF7F5] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#800020] transition-all duration-500" 
              style={{ width: `${Math.min(100, (subtotal / shippingThreshold) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Checkout Button */}
      <Link
        href="/checkout"
        className="mt-6 flex min-h-11 items-center justify-center rounded-lg bg-[#800020] text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#800020]/90 cursor-pointer text-center active:scale-95 duration-200"
      >
        Tiến Hành Thanh Toán
      </Link>
    </div>
  );
}
export default CartSummary;
