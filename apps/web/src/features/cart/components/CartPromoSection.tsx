"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Tag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ActiveDiscount } from "../types/cart.types";

interface CartPromoSectionProps {
  promoCode: string;
  setPromoCode: (code: string) => void;
  handleApplyPromo: (e: React.FormEvent) => void;
  handleRemovePromo: () => void;
  promoError: string | null;
  activeDiscount: ActiveDiscount | null;
  promoDescription: string | null;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Mã giảm giá: chưa áp dụng -> ô nhập + nút; đã áp dụng -> thẻ mã (gỡ được). Mỗi đơn chỉ một mã.
 */
export function CartPromoSection({
  promoCode,
  setPromoCode,
  handleApplyPromo,
  handleRemovePromo,
  promoError,
  activeDiscount,
  promoDescription,
}: CartPromoSectionProps) {
  const t = useTranslations("CartPage");

  return (
    <div>
      <p className="flex items-center gap-2 text-[10px] uppercase tracking-[2px] text-[var(--text-light)]">
        <Tag size={12} strokeWidth={1.6} />
        {t("promo.title")}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {activeDiscount ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="mt-2.5 flex items-center justify-between gap-3 border border-dashed border-emerald-700/40 bg-emerald-50/60 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-semibold tracking-[1.5px] text-emerald-800">{activeDiscount.code}</p>
              <p className="truncate text-[11px] text-emerald-800/80">{promoDescription}</p>
            </div>
            <button
              type="button"
              onClick={handleRemovePromo}
              aria-label={t("promo.remove")}
              title={t("promo.remove")}
              className="grid size-7 shrink-0 cursor-pointer place-items-center text-emerald-800/70 transition-colors hover:bg-white hover:text-[var(--destructive)]"
            >
              <X size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleApplyPromo}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="mt-2.5"
          >
            <div className="flex">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder={t("promo.placeholder")}
                aria-label={t("promo.title")}
                aria-invalid={Boolean(promoError)}
                className={`h-9 min-w-0 flex-1 border bg-white px-3 text-[12px] uppercase tracking-[1px] text-[var(--text-main)] outline-none transition-colors placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--text-light)]/70 focus:border-[var(--primary-color)] ${
                  promoError ? "border-[var(--destructive)]" : "border-[var(--border)]"
                }`}
              />
              <button
                type="submit"
                className="h-9 shrink-0 cursor-pointer bg-[var(--text-main)] px-4 text-[10px] font-semibold uppercase tracking-[1.5px] text-white transition-colors hover:bg-[var(--primary-color)]"
              >
                {t("promo.apply")}
              </button>
            </div>
            <AnimatePresence>
              {promoError ? (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pt-1.5 text-[11px] text-[var(--destructive)]"
                  role="alert"
                >
                  {promoError}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
