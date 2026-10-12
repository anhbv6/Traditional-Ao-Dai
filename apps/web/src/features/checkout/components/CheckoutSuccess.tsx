import React from "react";
import { Check } from "lucide-react";
import { Link } from "@/i18n/routing";

interface CheckoutSuccessProps {
  orderId: string;
  email: string;
}

export function CheckoutSuccess({ orderId, email }: CheckoutSuccessProps) {
  return (
    <div className="max-w-xl mx-auto mt-12 py-16 px-6 text-center bg-[var(--bg-main)] border border-[var(--border)]/40 rounded-2xl animate-scale-up shadow-sm">
      <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm animate-bounce">
        <Check size={36} />
      </div>
      <h1 className="mt-8 font-[family-name:var(--font-playfair)] text-3xl font-extrabold text-[var(--primary-ink)]">
        Đặt Hàng Thành Công!
      </h1>
      <p className="mt-3 text-sm text-[var(--text-light)]">
        Cảm ơn bạn đã mua sắm tại <strong>Traditional Ao Dai shop</strong>. Đơn hàng của bạn đã được nhận và đang được xử lý.
      </p>
      
      <div className="mt-6 p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]/40 inline-block">
        <p className="text-xs text-[var(--text-light)]">Mã đơn hàng của bạn</p>
        <p className="text-lg font-mono font-extrabold text-[var(--primary-ink)] tracking-wider mt-1">
          {orderId}
        </p>
      </div>

      <p className="mt-6 text-xs text-[var(--text-light)]/80">
        Chúng tôi đã gửi email xác nhận chi tiết đơn hàng đến địa chỉ <strong className="text-[var(--text-main)]">{email}</strong>.
      </p>

      <div className="mt-8 pt-6 border-t border-[var(--border)]/60">
        <Link
          href="/products"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--primary-color)] px-8 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[var(--primary-color)]/90 cursor-pointer active:scale-95 duration-200"
        >
          Tiếp Tục Mua Sắm
        </Link>
      </div>
    </div>
  );
}
export default CheckoutSuccess;
