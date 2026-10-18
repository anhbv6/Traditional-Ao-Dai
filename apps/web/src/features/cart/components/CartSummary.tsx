"use client";

import React from "react";
import { ArrowRight, Gift, Info, RefreshCcw, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { ActionLink } from "@/components/shared/ActionLink";
import { type ActiveDiscount, type CartTotals } from "../types/cart.types";

interface CartSummaryProps {
  totals: CartTotals;
  activeDiscount: ActiveDiscount | null;
  locale: Locale;
  hasCustomItems: boolean;
  /** Khối mã giảm giá đặt trong thẻ tóm tắt */
  promoSlot?: React.ReactNode;
}

const TRUST_POINTS = [
  { key: "returns", icon: RefreshCcw },
  { key: "payment", icon: ShieldCheck },
  { key: "packaging", icon: Gift },
] as const;

/**
 * Tóm tắt đơn hàng: mã giảm giá → tạm tính → giảm giá → vận chuyển → tổng (kèm số tiền tiết kiệm)
 * → nút thanh toán → cam kết dịch vụ. Số liệu chỉ để hiển thị; Backend tính lại khi tạo đơn.
 */
export function CartSummary({ totals, activeDiscount, locale, hasCustomItems, promoSlot }: CartSummaryProps) {
  const t = useTranslations("CartPage");
  const { subtotal, discountAmount, shippingCost, savings, total, totalQuantity } = totals;
  const totalSaved = savings + discountAmount;

  return (
    <div className="bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border)] sm:p-6">
      <h2 className="m-0 font-[family-name:var(--font-playfair)] text-lg font-semibold text-[var(--text-main)] sm:text-xl">{t("summary.title")}</h2>

      {promoSlot ? <div className="mt-5">{promoSlot}</div> : null}

      <dl className="mt-5 space-y-3 border-t border-[var(--border)] pt-5 text-[13px]">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--text-light)]">{t("summary.items", { count: totalQuantity })}</dt>
          <dd className="tabular-nums text-[var(--text-main)]">{formatVnd(subtotal, locale)}</dd>
        </div>
        {activeDiscount?.type === "percentage" ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[var(--text-light)]">
              {t("summary.discount")} <span className="text-[11px] font-semibold tracking-[1px] text-[var(--sale-gold)]">{activeDiscount.code}</span>
            </dt>
            <dd className="tabular-nums text-[var(--sale-gold)]">−{formatVnd(discountAmount, locale)}</dd>
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <dt className="text-[var(--text-light)]">
            {t("summary.shipping")}
            {shippingCost > 0 ? <span className="block text-[11px] text-[var(--text-light)]/80">{t("summary.shippingNote")}</span> : null}
          </dt>
          <dd className={shippingCost === 0 ? "text-[var(--sale-gold)]" : "tabular-nums text-[var(--text-main)]"}>
            {shippingCost === 0 ? t("summary.free") : formatVnd(shippingCost, locale)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-[var(--text-main)]/80 pt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-main)]">{t("summary.total")}</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-light)]">{t("summary.vatNote")}</p>
          </div>
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tabular-nums text-[var(--primary-ink)]">{formatVnd(total, locale)}</p>
        </div>
        {totalSaved > 0 ? (
          <p className="mt-2 text-right text-xs text-[var(--sale-gold)]">
            {t("summary.savings")} <span className="font-semibold tabular-nums">{formatVnd(totalSaved, locale)}</span>
          </p>
        ) : null}
      </div>

      <ActionLink href="/checkout" variant="confirm" size="lg" fullWidth icon={<ArrowRight />} iconPosition="end" className="mt-6">
        {t("summary.checkout")}
      </ActionLink>

      {hasCustomItems ? (
        <p className="mt-4 flex gap-2 bg-[var(--bg-secondary)]/70 px-3 py-2.5 text-[11px] leading-5 text-[var(--text-light)]">
          <Info size={13} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[var(--primary-ink)]" />
          {t("summary.customNote")}
        </p>
      ) : null}

      <ul className="mt-5 space-y-2.5 border-t border-[var(--border)] pt-5">
        {TRUST_POINTS.map(({ key, icon: Icon }) => (
          <li key={key} className="flex items-start gap-2.5 text-xs leading-5 text-[var(--text-light)]">
            <Icon size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--accent-color)]" />
            {t(`trust.${key}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
