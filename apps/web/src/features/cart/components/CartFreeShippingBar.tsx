"use client";

import React from "react";
import { motion } from "motion/react";
import { Check, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";

interface CartFreeShippingBarProps {
  subtotal: number;
  threshold: number;
  remaining: number;
  locale: Locale;
  /** Bản gọn cho mini-cart */
  compact?: boolean;
}

/** Thanh tiến trình miễn phí vận chuyển — khuyến khích mua thêm; đạt ngưỡng thì chuyển sang thông báo đã đạt */
export function CartFreeShippingBar({ subtotal, threshold, remaining, locale, compact = false }: CartFreeShippingBarProps) {
  const t = useTranslations("CartPage");
  const unlocked = remaining === 0;
  const progress = unlocked ? 100 : Math.min(100, (subtotal / threshold) * 100);

  return (
    <div className={compact ? "text-[11px]" : "text-[12px] sm:text-[13px]"}>
      <p className="flex items-center gap-2 text-[var(--text-light)]">
        {unlocked ? (
          <Check size={compact ? 12 : 14} className="shrink-0 text-emerald-700" />
        ) : (
          <Truck size={compact ? 12 : 14} strokeWidth={1.6} className="shrink-0 text-[var(--primary-color)]" />
        )}
        <span>
          {unlocked
            ? t("shipping.unlocked")
            : t.rich("shipping.remaining", {
                amount: formatVnd(remaining, locale),
                b: (chunks) => <strong className="font-semibold text-[var(--primary-color)]">{chunks}</strong>,
              })}
        </span>
      </p>
      <div className={`mt-2 h-[3px] w-full overflow-hidden bg-[var(--bg-secondary)] ${compact ? "" : "sm:h-1"}`}>
        <motion.div
          className={`h-full origin-left ${unlocked ? "bg-emerald-700" : "bg-[var(--primary-color)]"}`}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
