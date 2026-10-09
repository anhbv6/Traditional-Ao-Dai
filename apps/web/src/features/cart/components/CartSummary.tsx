"use client";

import React from "react";
import { ArrowRight, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { type ActiveDiscount, type CartTotals } from "../types/cart.types";

interface CartSummaryProps {
  totals: CartTotals;
  activeDiscount: ActiveDiscount | null;
  locale: Locale;
  hasCustomItems: boolean;
  /** Khối mã giảm giá đặt trong thẻ tóm tắt */
  promoSlot?: React.ReactNode;
}

/** Tóm tắt đơn hàng: tạm tính → giảm giá → vận chuyển → tổng; nút thanh toán có nền quét khi rê chuột */
export function CartSummary({ totals, activeDiscount, locale, hasCustomItems, promoSlot }: CartSummaryProps) {
  const t = useTranslations("CartPage");
  const { subtotal, discountAmount, shippingCost, total } = totals;

  return (
    <div className="border border-[var(--border)] bg-white p-4 sm:p-5">
      <h2 className="text-base font-semibold text-[var(--text-main)] sm:text-lg">{t("summary.title")}</h2>

      {promoSlot ? <div className="mt-4 border-t border-[var(--border)] pt-4">{promoSlot}</div> : null}

      <dl className="mt-4 space-y-2.5 border-t border-[var(--border)] pt-4 text-[13px]">
        <div className="flex items-center justify-between">
          <dt className="text-[var(--text-light)]">{t("summary.subtotal")}</dt>
          <dd className="text-[var(--text-main)]">{formatVnd(subtotal, locale)}</dd>
        </div>
        {activeDiscount?.type === "percentage" ? (
          <div className="flex items-center justify-between text-emerald-800">
            <dt>
              {t("summary.discount")} <span className="text-[11px] tracking-[1px]">({activeDiscount.code})</span>
            </dt>
            <dd>−{formatVnd(discountAmount, locale)}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <dt className="text-[var(--text-light)]">{t("summary.shipping")}</dt>
          <dd className={shippingCost === 0 ? "text-emerald-800" : "text-[var(--text-main)]"}>
            {shippingCost === 0 ? t("summary.free") : formatVnd(shippingCost, locale)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-end justify-between border-t border-[var(--border)] pt-4">
        <div>
          <p className="text-[13px] font-semibold text-[var(--text-main)]">{t("summary.total")}</p>
          <p className="text-[10px] text-[var(--text-light)]">{t("summary.vatNote")}</p>
        </div>
        <p className="text-lg font-semibold text-[var(--primary-color)] sm:text-xl">{formatVnd(total, locale)}</p>
      </div>

      <Link
        href="/checkout"
        className="group/btn relative mt-5 flex min-h-11 items-center justify-center overflow-hidden bg-[var(--primary-color)] text-[11px] font-semibold uppercase tracking-[2px] text-white"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 origin-left scale-x-0 bg-[#2A0A12] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:scale-x-100"
        />
        <span className="relative flex items-center gap-2">
          {t("summary.checkout")}
          <ArrowRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
        </span>
      </Link>

      {hasCustomItems ? (
        <p className="mt-3 flex gap-2 text-[11px] leading-5 text-[var(--text-light)]">
          <Info size={13} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[var(--primary-color)]" />
          {t("summary.customNote")}
        </p>
      ) : null}
    </div>
  );
}
