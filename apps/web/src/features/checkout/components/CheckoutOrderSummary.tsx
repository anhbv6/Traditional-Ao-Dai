"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { type ActiveDiscount, type CartTotals } from "@/features/cart";
import { type CartItem, type PaymentMethod, type ShippingData } from "../types/checkout.types";

/** Vạch kẻ nét đứt kiểu hoá đơn in */
const DASHED = "border-t border-dashed border-[var(--text-light)]/40";
/** Mép giấy răng cưa ở đáy hoá đơn (vẽ bằng gradient tròn lặp lại, cùng màu nền thẻ) */
const TORN_EDGE =
  "h-2.5 shrink-0 bg-[radial-gradient(circle_at_7px_0,var(--bg-card)_6px,transparent_6.5px)] bg-[length:14px_10px] bg-repeat-x";

interface CheckoutOrderSummaryProps {
  cartItems: CartItem[];
  totals: CartTotals;
  discount: ActiveDiscount | null;
  locale: Locale;
  /** Có sau bước Thanh toán → in "Số đơn" */
  orderId?: string;
  /** Có sau bước Giao hàng → in tên khách */
  shipping?: ShippingData | null;
  /** Có sau bước Thanh toán → in phương thức */
  paymentMethod?: PaymentMethod | null;
}

/** Một dòng nhãn — giá trị của phần thông tin đầu hoá đơn */
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[var(--text-light)]">{label}</dt>
      <dd className="truncate text-right font-semibold text-[var(--text-main)]">{value}</dd>
    </div>
  );
}

/**
 * Tóm tắt đơn ở cột phải, trình bày như HOÁ ĐƠN khách nhận kèm hàng (không ảnh — chỉ thông tin):
 * - Đầu: AODAI · "Hoá đơn bán hàng" · số đơn / ngày / khách / thanh toán (điền dần theo các bước).
 * - Giữa (tự cuộn khi dài): cột Sản phẩm | Thành tiền; mỗi dòng: tên, phân loại, "SL × đơn giá".
 * - Đáy (luôn thấy): tạm tính → giảm giá → vận chuyển → TỔNG CỘNG (vạch đôi) → lời cảm ơn; mép giấy răng cưa.
 * Ghim cao vừa màn hình trên desktop (cha đặt chiều cao), mobile cao theo nội dung.
 */
export function CheckoutOrderSummary({
  cartItems,
  totals,
  discount,
  locale,
  orderId,
  shipping,
  paymentMethod,
}: CheckoutOrderSummaryProps) {
  const t = useTranslations("CheckoutPage");
  const { subtotal, discountAmount, shippingCost, savings, total, totalQuantity } = totals;
  const totalSaved = savings + discountAmount;
  // Hoá đơn chỉ hiện khi giỏ đã nạp ở client → ngày tính theo máy khách, không lệch server
  const today = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB").format(new Date());
  const pending = t("summary.pending");

  return (
    <div className="flex flex-col drop-shadow-[0_10px_24px_rgba(42,10,18,0.08)] lg:h-full">
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--bg-card)] text-[13px] [font-variant-numeric:lining-nums_tabular-nums]">
        {/* Đầu hoá đơn */}
        <header className="shrink-0 px-5 pt-6 text-center sm:px-6">
          <p className="font-[family-name:var(--font-playfair)] text-xl font-semibold tracking-[0.3em] text-[var(--primary-ink)]">AODAI</p>
          <p className="mt-1 text-[11px] text-[var(--text-light)]">{t("summary.brandLine")}</p>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[3px] text-[var(--text-main)]">{t("summary.receipt")}</p>

          <dl className={`mt-4 space-y-1.5 pt-4 text-left text-xs ${DASHED}`}>
            <MetaRow label={t("summary.orderNo")} value={orderId || pending} />
            <MetaRow label={t("summary.date")} value={today} />
            <MetaRow label={t("summary.customer")} value={shipping?.fullName || pending} />
            <MetaRow label={t("summary.payment")} value={paymentMethod ? t(`payment.methods.${paymentMethod}.title`) : pending} />
          </dl>

          <div className={`mt-4 flex items-baseline justify-between pt-3 text-[10px] font-semibold uppercase tracking-[2px] text-[var(--text-light)] ${DASHED}`}>
            <span>{t("summary.itemColumn")}</span>
            <span>{t("summary.amountColumn")}</span>
          </div>
        </header>

        {/* Dòng hàng: cuộn riêng, không kéo theo trang (data-lenis-prevent) */}
        <ul data-lenis-prevent className="scrollbar-brand px-5 sm:px-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
          {cartItems.map((item, index) => {
            const variant = [t("summary.variant", { size: item.size }), item.color, item.measurements ? t("summary.custom") : null]
              .filter(Boolean)
              .join(" · ");
            return (
              // Dòng hoá đơn "in" lần lượt từ trên xuống
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + Math.min(index, 8) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="border-b border-dotted border-[var(--text-light)]/30 py-3 last:border-b-0"
              >
                <p className="font-semibold leading-snug text-[var(--text-main)]">{item.name}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-light)]">{variant}</p>
                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <span className="text-xs text-[var(--text-light)]">
                    {t("summary.lineQuantity", { count: item.quantity, price: formatVnd(item.price, locale) })}
                  </span>
                  <span className="font-semibold text-[var(--text-main)]">{formatVnd(item.price * item.quantity, locale)}</span>
                </div>
              </motion.li>
            );
          })}
        </ul>

        {/* Đáy hoá đơn: số liệu + tổng — luôn hiện */}
        <div className="shrink-0 px-5 pb-5 sm:px-6">
          <dl className={`space-y-1.5 pt-3 ${DASHED}`}>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--text-light)]">{t("summary.items", { count: totalQuantity })}</dt>
              <dd>{formatVnd(subtotal, locale)}</dd>
            </div>
            {discountAmount > 0 ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-light)]">
                  {t("summary.discount")}
                  {discount ? <span className="ml-1.5 text-[11px] font-semibold tracking-[1px] text-[var(--sale-gold)]">{discount.code}</span> : null}
                </dt>
                <dd className="text-[var(--sale-gold)]">−{formatVnd(discountAmount, locale)}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--text-light)]">{t("summary.shipping")}</dt>
              <dd className={shippingCost === 0 ? "text-[var(--sale-gold)]" : undefined}>
                {shippingCost === 0 ? t("summary.free") : formatVnd(shippingCost, locale)}
              </dd>
            </div>
          </dl>

          {/* Tổng cộng: vạch đôi như hoá đơn in */}
          <div className="mt-3 border-y-[3px] border-double border-[var(--text-main)]/70 py-2.5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[2px]">{t("summary.grandTotal")}</span>
              {/* Tổng "lăn" lên khi số tiền đổi */}
              <span className="relative h-8 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={total}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="block font-[family-name:var(--font-playfair)] text-[1.375rem] font-semibold text-[var(--primary-ink)]"
                  >
                    {formatVnd(total, locale)}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
            <p className="text-right text-[10px] text-[var(--text-light)]">{t("summary.vatNote")}</p>
          </div>
          {totalSaved > 0 ? (
            <p className="mt-1.5 text-right text-xs text-[var(--sale-gold)]">
              {t("summary.savings")} <span className="font-semibold">{formatVnd(totalSaved, locale)}</span>
            </p>
          ) : null}

          <p className="mt-4 text-center font-[family-name:var(--font-playfair)] text-[13px] italic text-[var(--text-light)]">{t("summary.thanks")}</p>
          <Link
            href="/cart"
            className="mx-auto mt-3 block w-fit border-b border-[var(--primary-color)]/30 pb-0.5 text-[10px] uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
          >
            {t("summary.editCart")}
          </Link>
        </div>
      </div>
      {/* Mép giấy răng cưa */}
      <div aria-hidden="true" className={TORN_EDGE} />
    </div>
  );
}
export default CheckoutOrderSummary;
