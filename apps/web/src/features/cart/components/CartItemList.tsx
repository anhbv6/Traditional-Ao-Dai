"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { MAX_LINE_QUANTITY, getCartItemHref, getDiscountPercent } from "../utils/pricing";
import { type CartItem } from "../types/cart.types";
import { QuantityStepper } from "./QuantityStepper";

const EASE = [0.22, 1, 0.36, 1] as const;
const FALLBACK_IMAGE = "/logoPage.png";

interface CartItemListProps {
  cartItems: CartItem[];
  locale: Locale;
  handleQuantityChange: (id: string, quantity: number) => void;
  handleRemoveItem: (id: string) => void;
}

function CartLineImage({ item }: { item: CartItem }) {
  const [failed, setFailed] = useState(false);
  return (
    <Link
      href={getCartItemHref(item)}
      className="group/img relative block aspect-[3/4] w-24 shrink-0 overflow-hidden bg-[var(--bg-secondary)] sm:w-28 xl:w-32"
    >
      <Image
        src={failed ? FALLBACK_IMAGE : item.image}
        alt={item.name}
        fill
        sizes="(max-width: 640px) 96px, 128px"
        className={`transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/img:scale-105 ${failed ? "object-contain p-3" : "object-cover"}`}
        onError={() => setFailed(true)}
      />
    </Link>
  );
}

/**
 * Danh sách sản phẩm trong giỏ dạng thẻ ngang (thay cho bảng nhiều cột — không bị bóp chữ ở laptop nhỏ):
 * ảnh dọc 3:4 — tên + màu/size — giá (giá gốc gạch, % giảm) — số đo may đo — số lượng & xóa.
 * Xóa dòng: dòng co chiều cao và mờ dần, các dòng dưới trượt lên (có Hoàn tác ở snackbar).
 */
export function CartItemList({ cartItems, locale, handleQuantityChange, handleRemoveItem }: CartItemListProps) {
  const t = useTranslations("CartPage");
  const stepperLabels = {
    decrease: t("item.decrease"),
    increase: t("item.increase"),
    quantity: t("item.quantity"),
    maxReached: t("item.maxReached", { max: MAX_LINE_QUANTITY }),
  };

  return (
    <ul className="border-t border-[var(--border)]">
      <AnimatePresence initial={false}>
        {cartItems.map((item, index) => {
          const lineTotal = item.price * item.quantity;
          const measurements = item.measurements ? Object.entries(item.measurements) : [];
          const discountPercent = getDiscountPercent(item.price, item.originalPrice);

          return (
            <motion.li
              key={item.id}
              layout="position"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.35, ease: EASE } }}
              transition={{ duration: 0.5, ease: EASE, delay: Math.min(index, 6) * 0.04 }}
              className="overflow-hidden border-b border-[var(--border)] last:border-b-0"
            >
              <article className="flex gap-4 py-5 sm:gap-6 sm:py-6">
                <CartLineImage item={item} />

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      {measurements.length > 0 ? (
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[2px] text-[var(--primary-ink)]">{t("item.custom")}</p>
                      ) : null}
                      <h3 className="m-0 text-[15px] leading-snug sm:text-base lg:text-[1.0625rem]">
                        <Link
                          href={getCartItemHref(item)}
                          className="line-clamp-2 font-[family-name:var(--font-playfair)] font-semibold text-[var(--text-main)] transition-colors hover:text-[var(--primary-ink)]"
                        >
                          {item.name}
                        </Link>
                      </h3>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-light)]">
                        {item.color ? (
                          <>
                            <span>
                              {t("item.color")}: <span className="text-[var(--text-main)]">{item.color}</span>
                            </span>
                            <span aria-hidden="true" className="size-1 rotate-45 bg-[var(--accent-color)]" />
                          </>
                        ) : null}
                        <span>
                          {t("item.size")}: <span className="text-[var(--text-main)]">{item.size}</span>
                        </span>
                      </p>
                    </div>

                    {/* Thành tiền (tablet trở lên) */}
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-[15px] font-semibold tabular-nums text-[var(--text-main)]">{formatVnd(lineTotal, locale)}</p>
                      {item.quantity > 1 ? (
                        <p className="mt-0.5 text-[11px] text-[var(--text-light)]">{t("item.unitPrice", { price: formatVnd(item.price, locale) })}</p>
                      ) : null}
                    </div>
                  </div>

                  {/* Đơn giá + giá gốc + % giảm */}
                  <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px]">
                    <span className="text-[var(--primary-ink)]">{formatVnd(item.price, locale)}</span>
                    {discountPercent > 0 ? (
                      <>
                        <span className="text-[11px] text-[var(--text-light)]/80 line-through">{formatVnd(item.originalPrice ?? 0, locale)}</span>
                        <span className="text-[11px] font-semibold text-[var(--sale-gold)]">{t("item.off", { percent: discountPercent })}</span>
                      </>
                    ) : null}
                  </p>

                  {measurements.length > 0 ? (
                    <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-l-2 border-[var(--accent-color)] bg-[var(--bg-secondary)]/70 px-3 py-2 text-[11px] text-[var(--text-light)]">
                      <dt className="sr-only">{t("item.measurements")}</dt>
                      {measurements.map(([label, value]) => (
                        <dd key={label}>
                          {label} <span className="font-semibold text-[var(--text-main)]">{value}</span>
                        </dd>
                      ))}
                    </dl>
                  ) : null}

                  {/* Số lượng — xóa (thành tiền hiện ở đây trên mobile) */}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div className="flex items-center gap-4">
                      <QuantityStepper value={item.quantity} onChange={(q) => handleQuantityChange(item.id, q)} labels={stepperLabels} />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label={`${t("item.remove")}: ${item.name}`}
                        className="group inline-flex min-h-8 cursor-pointer items-center gap-1.5 text-[11px] uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:text-[var(--destructive)]"
                      >
                        <X size={13} strokeWidth={1.6} className="transition-transform duration-300 group-hover:rotate-90" />
                        <span className="border-b border-transparent group-hover:border-current">{t("item.removeShort")}</span>
                      </button>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-[var(--text-main)] sm:hidden">{formatVnd(lineTotal, locale)}</p>
                  </div>
                </div>
              </article>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
