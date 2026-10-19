"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CHECKOUT_STEPS, type CheckoutStep } from "../types/checkout.types";

const EASE = [0.22, 1, 0.36, 1] as const;

interface CheckoutProgressProps {
  step: CheckoutStep;
  /** Chỉ số bước xa nhất đã mở khoá — các bước tới đó bấm quay lại được */
  maxStepIndex: number;
  onStepChange: (step: CheckoutStep) => void;
}

/**
 * Thanh tiến trình 3 bước (không phải tab): các mốc hình thoi nối bằng một đường kẻ
 * — phần đã đi tô đỏ đô và "chạy" tới mốc hiện tại mỗi khi đổi bước.
 * - Mốc đã xong: thoi đặc + ✓ (bấm để quay lại sửa). Mốc hiện tại: viền đỏ đô + vòng sáng "thở". Mốc chưa tới: mờ, khoá.
 * - Dưới mỗi mốc: "Bước 01" + tên bước.
 * - Giảm chuyển động: bỏ vòng sáng lặp, đường kẻ đổi ngay.
 */
export function CheckoutProgress({ step, maxStepIndex, onStepChange }: CheckoutProgressProps) {
  const t = useTranslations("CheckoutPage.steps");
  const reduceMotion = useReducedMotion();
  const activeIndex = CHECKOUT_STEPS.indexOf(step);
  const lastIndex = CHECKOUT_STEPS.length - 1;
  /* Đường kẻ chạy giữa tâm mốc đầu và tâm mốc cuối (mỗi mốc chiếm 1/3 bề ngang, tâm ở 1/6) */
  const inset = `${100 / (CHECKOUT_STEPS.length * 2)}%`;

  return (
    <nav aria-label={t("label")} className="mb-8 sm:mb-10">
      <ol className="relative grid grid-cols-3">
        {/* Đường nền + phần đã đi */}
        <span aria-hidden="true" className="absolute top-[18px] h-px bg-[var(--border)]" style={{ left: inset, right: inset }} />
        <span aria-hidden="true" className="absolute top-[18px] h-px" style={{ left: inset, right: inset }}>
          <motion.span
            className="absolute inset-y-0 left-0 bg-[var(--primary-color)]"
            initial={false}
            animate={{ width: `${(activeIndex / lastIndex) * 100}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: EASE }}
          />
        </span>

        {CHECKOUT_STEPS.map((key, index) => {
          const isActive = index === activeIndex;
          // Đã xong = nằm trước bước xa nhất từng tới (kể cả khi đang quay lại sửa bước trước đó)
          const isDone = !isActive && index < maxStepIndex;
          const isReachable = index <= maxStepIndex;

          return (
            <li key={key} className="relative flex justify-center">
              <button
                type="button"
                onClick={() => onStepChange(key)}
                disabled={!isReachable}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "group flex flex-col items-center gap-3 text-center outline-none disabled:cursor-not-allowed",
                  isReachable && !isActive && "cursor-pointer",
                )}
              >
                {/* Mốc hình thoi */}
                <span className="relative grid size-9 place-items-center">
                  {isActive && !reduceMotion ? (
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-1 rotate-45 border border-[var(--primary-color)]"
                      animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                    />
                  ) : null}
                  <motion.span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-1.5 rotate-45 border transition-colors duration-500 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--ring)]",
                      isDone
                        ? "border-[var(--primary-color)] bg-[var(--primary-color)] group-hover:bg-[var(--bg-wine)]"
                        : isActive
                          ? "border-[var(--primary-color)] bg-[var(--bg-card)]"
                          : "border-[var(--border)] bg-[var(--bg-main)]",
                    )}
                    initial={false}
                    animate={{ scale: isActive ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  />
                  <span
                    className={cn(
                      "relative font-[family-name:var(--font-playfair)] text-[13px] italic transition-colors duration-500",
                      isDone ? "text-white" : isActive ? "text-[var(--primary-ink)]" : "text-[var(--text-light)]/70",
                    )}
                  >
                    {isDone ? (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }} className="block">
                        <Check size={14} strokeWidth={2.2} />
                      </motion.span>
                    ) : (
                      index + 1
                    )}
                  </span>
                </span>

                {/* Nhãn dưới mốc */}
                <span className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] uppercase tracking-[2px] text-[var(--text-light)]">
                    {t("stepNumber", { number: String(index + 1).padStart(2, "0") })}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[2px] transition-colors duration-500 sm:text-xs",
                      isActive ? "text-[var(--primary-ink)]" : isReachable ? "text-[var(--text-main)] group-hover:text-[var(--primary-ink)]" : "text-[var(--text-light)]/60",
                    )}
                  >
                    {t(key)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
export default CheckoutProgress;
