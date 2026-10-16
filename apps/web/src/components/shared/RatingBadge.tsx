"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Star } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { OrnateFrame } from "./OrnateFrame";

/**
 * Thẻ điểm đánh giá — nội dung đặt trong khung dùng chung OrnateFrame (viền gấm, vệt sáng, bồng bềnh, nhấc khi rê chuột).
 *
 * Hiệu ứng riêng (chạy khi thẻ cuộn vào màn hình, tôn trọng "giảm chuyển động"):
 *  - Điểm số đếm từ 0 lên, sao lần lượt được tô vàng — sao cuối tô theo phần lẻ (4.9 → 90%).
 *
 * Định vị (absolute / margin…) truyền qua `className` — lớp ngoài cùng không bị animate nên không xung đột transform.
 *
 * @example
 * <RatingBadge score={4.9} label={t("ratingLabel")} caption={t("ratingCount")} className="absolute -right-8 bottom-12" />
 */
interface RatingBadgeProps {
  score: number;
  /** Thang điểm — mặc định 5 */
  max?: number;
  /** Dòng nhỏ phía trên điểm, VD "Khách hàng đánh giá" */
  label?: ReactNode;
  /** Dòng mô tả dưới sao, VD "Từ hơn 1.200 đánh giá" */
  caption?: ReactNode;
  className?: string;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function RatingBadge({ score, max = 5, label, caption, className }: RatingBadgeProps) {
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  /* Định dạng số theo ngôn ngữ (vi: 4,9 — en: 4.9) */
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    [locale],
  );
  const count = useMotionValue(0);
  const countText = useTransform(count, (value) => formatter.format(value));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, score, { duration: reduceMotion ? 0 : 1.6, ease: EASE_OUT });
    return () => controls.stop();
  }, [inView, score, count, reduceMotion]);

  return (
    <div ref={ref} className={className}>
      <OrnateFrame
        role="img"
        aria-label={`${formatter.format(score)} / ${max}${typeof caption === "string" ? ` — ${caption}` : ""}`}
        shimmer="loop"
        reveal
        float
        hoverLift
        contentClassName="px-7 pb-5 pt-6"
      >
        <div aria-hidden="true">
          {label ? (
            <p className="text-[9px] font-semibold uppercase tracking-[2.5px] text-[var(--accent-color)]">{label}</p>
          ) : null}

          <p className={cn("flex items-baseline gap-1 font-[family-name:var(--font-playfair)]", label ? "mt-2" : undefined)}>
            <motion.span className="text-[40px] font-semibold leading-none tabular-nums text-[var(--primary-ink)]">
              {countText}
            </motion.span>
            <span className="text-sm text-[var(--text-light)]">/ {max}</span>
          </p>

          {/* Sao: nền vàng nhạt + lớp vàng đậm "rót" dần theo điểm */}
          <span className="mt-2.5 flex gap-1">
            {Array.from({ length: max }, (_, i) => {
              const fill = Math.min(Math.max(score - i, 0), 1);
              return (
                <span key={i} className="relative size-3.5">
                  <Star size={14} fill="currentColor" stroke="none" className="absolute inset-0 text-[var(--accent-color)]/25" />
                  <motion.span
                    className="absolute inset-y-0 left-0 overflow-hidden"
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${fill * 100}%` } : undefined}
                    transition={{ delay: reduceMotion ? 0 : 0.35 + i * 0.14, duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
                  >
                    <Star size={14} fill="currentColor" stroke="none" className="max-w-none text-[#C9A227]" />
                  </motion.span>
                </span>
              );
            })}
          </span>

          {caption ? (
            <p className="mt-3 border-t border-[var(--accent-color)]/25 pt-2.5 text-[11px] text-[var(--text-light)]">{caption}</p>
          ) : null}
        </div>
      </OrnateFrame>
    </div>
  );
}
