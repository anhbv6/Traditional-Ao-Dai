"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { type OrderAmountsDto, type PaymentMethod } from "@repo/shared/orders";
import { cn } from "@/lib/utils";

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "accent" }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-1.5", strong && "pt-3 text-base font-semibold")}>
      <dt className={strong ? "text-(--text-main)" : "text-(--text-light)"}>{label}</dt>
      <dd className={cn("tabular-nums", tone === "accent" ? "font-semibold text-(--primary-ink)" : "text-(--text-main)")}>{value}</dd>
    </div>
  );
}

/** Bảng tiền của đơn: tạm tính → giảm giá → vận chuyển → tổng → đã cọc/trả → còn phải trả (COD) */
export function OrderAmounts({ amounts, paymentMethod }: { amounts: OrderAmountsDto; paymentMethod: PaymentMethod }) {
  const t = useTranslations("OrdersPage.amounts");
  const locale = useLocale() as Locale;
  const vnd = (value: number) => formatVnd(value, locale);

  return (
    <dl className="text-sm">
      <Row label={t("subTotal")} value={vnd(amounts.subTotal)} />
      {amounts.discountAmount > 0 ? <Row label={t("discount")} value={`−${vnd(amounts.discountAmount)}`} /> : null}
      <Row label={t("shipping")} value={amounts.shippingFee > 0 ? vnd(amounts.shippingFee) : t("free")} />
      <div className="mt-1 border-t border-(--border)">
        <Row strong label={t("total")} value={vnd(amounts.totalAmount)} />
      </div>
      {paymentMethod !== "COD" ? (
        <Row label={paymentMethod === "DEPOSIT" ? t("deposit") : t("prepay")} value={vnd(amounts.prepayAmount)} />
      ) : null}
      <Row label={t("paid")} value={vnd(amounts.paidAmount)} />
      <Row label={t("balance")} value={vnd(amounts.balanceDue)} tone="accent" />
      {paymentMethod === "DEPOSIT" ? <p className="mt-2 text-xs leading-5 text-(--text-light)">{t("codRemainder")}</p> : null}
    </dl>
  );
}
