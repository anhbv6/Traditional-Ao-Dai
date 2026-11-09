"use client";

import React from "react";
import { motion } from "motion/react";
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
 * Thanh tiến trình 3 bước: [vòng số + nhãn] —— [vòng số + nhãn] —— [vòng số + nhãn].
 * - Bước đã xong: vòng viền đỏ đô + ✓ (bấm để quay lại sửa). Bước hiện tại: vòng nền đỏ đô. Bước chưa tới: xám, khoá.
 * - Đoạn nối giữa hai bước tô dần (scaleX) khi đã đi qua bước bên trái — chỉ chạy một lần mỗi lần đổi bước, không lặp.
 * - Mobile: ẩn dòng "Bước 0x"; chỉ bước đang ở hiện tên, các bước khác chỉ còn vòng số để không chật.
 */
export function CheckoutProgress({ step, maxStepIndex, onStepChange }: CheckoutProgressProps) {
  const t = useTranslations("CheckoutPage.steps");
  const activeIndex = CHECKOUT_STEPS.indexOf(step);

  return (
    <nav aria-label={t("label")} className="mb-6 sm:mb-8">
      <ol className="flex items-center gap-2 sm:gap-3">
        {CHECKOUT_STEPS.map((key, index) => {
          const isActive = index === activeIndex;
          // Đã xong = nằm trước bước xa nhất từng tới (kể cả khi đang quay lại sửa bước trước đó)
          const isDone = !isActive && index < maxStepIndex;
          const isReachable = index <= maxStepIndex;
          const isLast = index === CHECKOUT_STEPS.length - 1;

          return (
            <React.Fragment key={key}>
              <li className="shrink-0">
                <button
                  type="button"
                  onClick={() => onStepChange(key)}
                  disabled={!isReachable}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "group flex items-center gap-2.5 py-1 text-left outline-none disabled:cursor-not-allowed",
                    isReachable && !isActive && "cursor-pointer",
                  )}
                >
                  <span
                    className={cn(
                      "relative grid size-8 shrink-0 place-items-center rounded-full border text-[13px] font-semibold tabular-nums transition-colors duration-300",
                      "group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--ring)]",
                      isActive
                        ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                        : isDone
                          ? "border-[var(--primary-color)] bg-[var(--bg-card)] text-[var(--primary-ink)] group-hover:bg-[var(--primary-color)]/8"
                          : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-light)]",
                    )}
                  >
                    {isDone ? (
                      <motion.span
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="grid place-items-center"
                      >
                        <Check size={15} strokeWidth={2.4} aria-hidden="true" />
                      </motion.span>
                    ) : (
                      index + 1
                    )}
                  </span>

                  {/* Màn nhỏ: chỉ bước đang ở hiện tên, các bước khác còn vòng số → không tràn ngang */}
                  <span className={cn("flex-col leading-tight", isActive ? "flex" : "hidden sm:flex")}>
                    <span className="hidden text-[10px] uppercase tracking-[1.8px] text-[var(--text-light)] sm:block">
                      {t("stepNumber", { number: String(index + 1).padStart(2, "0") })}
                    </span>
                    <span
                      className={cn(
                        "text-[13px] font-semibold transition-colors duration-300 sm:text-sm",
                        isActive
                          ? "text-[var(--primary-ink)]"
                          : isReachable
                            ? "text-[var(--text-main)] group-hover:text-[var(--primary-ink)]"
                            : "text-[var(--text-light)]",
                      )}
                    >
                      {t(key)}
                    </span>
                  </span>
                </button>
              </li>

              {/* Đoạn nối: nền xám + phần tô đỏ đô chạy từ trái sang khi đã qua bước bên trái */}
              {!isLast ? (
                <li aria-hidden="true" className="relative h-px min-w-4 flex-1 bg-[var(--border)]">
                  <motion.span
                    className="absolute inset-0 origin-left bg-[var(--primary-color)]"
                    initial={false}
                    animate={{ scaleX: index < activeIndex ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                </li>
              ) : null}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
export default CheckoutProgress;
