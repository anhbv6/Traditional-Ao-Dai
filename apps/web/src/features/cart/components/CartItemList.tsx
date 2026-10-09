"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { MAX_LINE_QUANTITY } from "../utils/pricing";
import { type CartItem } from "../types/cart.types";
import { QuantityStepper } from "./QuantityStepper";

const EASE = [0.22, 1, 0.36, 1] as const;
const FALLBACK_IMAGE = "/logoPage.png";
/** Lưới cột desktop: sản phẩm | đơn giá | số lượng | thành tiền | xóa */
const ROW_GRID = "md:grid md:grid-cols-[minmax(0,1fr)_110px_120px_120px_32px] md:items-center md:gap-4";

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
      href={`/products/${item.slug}`}
      className="relative block aspect-[3/4] w-[72px] shrink-0 overflow-hidden bg-[var(--bg-secondary)] sm:w-20"
    >
      <Image
        src={failed ? FALLBACK_IMAGE : item.image}
        alt={item.name}
        fill
        sizes="80px"
        className={`transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 ${failed ? "object-contain p-2" : "object-cover"}`}
        onError={() => setFailed(true)}
      />
    </Link>
  );
}

/**
 * Danh sách dòng giỏ hàng. Desktop: dạng bảng có tiêu đề cột. Mobile: ảnh + thông tin xếp gọn, số lượng & thành tiền ở hàng dưới.
 * Xóa dòng: dòng co chiều cao và mờ dần, các dòng dưới trượt lên.
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
    <div>
      {/* Tiêu đề cột (desktop) */}
      <div className={`hidden border-b border-[var(--border)] pb-2.5 text-[10px] uppercase tracking-[2px] text-[var(--text-light)] ${ROW_GRID}`}>
        <span>{t("columns.product")}</span>
        <span className="text-right">{t("columns.price")}</span>
        <span className="text-center">{t("columns.quantity")}</span>
        <span className="text-right">{t("columns.lineTotal")}</span>
        <span />
      </div>

      <ul>
        <AnimatePresence initial={false}>
          {cartItems.map((item, index) => {
            const lineTotal = item.price * item.quantity;
            const measurements = item.measurements ? Object.entries(item.measurements) : [];

            return (
              <motion.li
                key={item.id}
                layout="position"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.35, ease: EASE } }}
                transition={{ duration: 0.5, ease: EASE, delay: Math.min(index, 6) * 0.04 }}
                className="overflow-hidden border-b border-[var(--border)]"
              >
                <div className={`flex gap-3 py-4 sm:gap-4 sm:py-5 ${ROW_GRID}`}>
                  {/* Sản phẩm */}
                  <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
                    <CartLineImage item={item} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="min-w-0 text-[13px] leading-snug sm:text-[15px]">
                          <Link
                            href={`/products/${item.slug}`}
                            className="line-clamp-2 font-[family-name:var(--font-playfair)] font-semibold text-[var(--text-main)] transition-colors hover:text-[var(--primary-color)]"
                          >
                            {item.name}
                          </Link>
                        </h3>
                        {/* Nút xóa (mobile) */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label={t("item.remove")}
                          className="-mr-1 -mt-1 grid size-7 shrink-0 cursor-pointer place-items-center text-[var(--text-light)] transition-colors hover:text-[var(--destructive)] md:hidden"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--text-light)] sm:text-xs">
                        {item.color ? (
                          <span>
                            {t("item.color")}: <span className="text-[var(--text-main)]">{item.color}</span>
                          </span>
                        ) : null}
                        {item.color ? <span aria-hidden="true" className="h-2.5 w-px bg-[var(--border)]" /> : null}
                        <span>
                          {t("item.size")}: <span className="text-[var(--text-main)]">{item.size}</span>
                        </span>
                        {measurements.length > 0 ? (
                          <span className="bg-[var(--primary-color)] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[1px] text-white">
                            {t("item.custom")}
                          </span>
                        ) : null}
                      </p>

                      {measurements.length > 0 ? (
                        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[var(--text-light)] sm:text-[11px]">
                          {t("item.measurements")}: {measurements.map(([label, value]) => `${label}: ${value}`).join(" · ")}
                        </p>
                      ) : null}

                      {/* Đơn giá (mobile) */}
                      <p className="mt-1.5 flex items-baseline gap-1.5 text-[12px] md:hidden">
                        <span className="text-[var(--text-main)]">{formatVnd(item.price, locale)}</span>
                        {item.originalPrice ? (
                          <span className="text-[10px] text-[var(--text-light)]/70 line-through">{formatVnd(item.originalPrice, locale)}</span>
                        ) : null}
                      </p>

                      {/* Số lượng + thành tiền (mobile) */}
                      <div className="mt-auto flex items-end justify-between gap-2 pt-2.5 md:hidden">
                        <QuantityStepper value={item.quantity} onChange={(q) => handleQuantityChange(item.id, q)} labels={stepperLabels} />
                        <span className="text-[13px] font-semibold text-[var(--primary-color)]">{formatVnd(lineTotal, locale)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cột desktop */}
                  <div className="hidden text-right text-[13px] md:block">
                    <p className="text-[var(--text-main)]">{formatVnd(item.price, locale)}</p>
                    {item.originalPrice ? (
                      <p className="text-[11px] text-[var(--text-light)]/70 line-through">{formatVnd(item.originalPrice, locale)}</p>
                    ) : null}
                  </div>
                  <div className="hidden justify-center md:flex">
                    <QuantityStepper value={item.quantity} onChange={(q) => handleQuantityChange(item.id, q)} labels={stepperLabels} />
                  </div>
                  <p className="hidden text-right text-[14px] font-semibold text-[var(--primary-color)] md:block">
                    {formatVnd(lineTotal, locale)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label={t("item.remove")}
                    title={t("item.remove")}
                    className="group hidden size-8 cursor-pointer place-items-center text-[var(--text-light)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--destructive)] md:grid"
                  >
                    <X size={15} className="transition-transform duration-300 group-hover:rotate-90" />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
