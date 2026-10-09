"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

interface AboutHeadingProps {
  /** Số La Mã của chương (I, II, III) — khác cách đánh số 01/02 ở trang chủ */
  numeral: string;
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}

/**
 * Tiêu đề khối riêng của trang Câu chuyện: vạch kẻ ngang trên cùng, căn trái,
 * tiêu đề một bên — mô tả một bên (desktop). Đọc như mở đầu một chương sách.
 * Khi cuộn tới: vạch kẻ chạy từ trái sang, tiêu đề trồi lên từ sau mép che (như lật trang).
 */
export function AboutHeading({ numeral, eyebrow, title, description, className }: AboutHeadingProps) {
  const reduceMotion = useReducedMotion();
  const timing = (duration: number, delay: number) => (reduceMotion ? { duration: 0 } : { duration, delay, ease: EASE });

  return (
    <motion.header
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      className={cn("relative mb-12 pt-5 sm:mb-14", className)}
    >
      <motion.span
        aria-hidden="true"
        variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1 } }}
        transition={timing(1.2, 0)}
        className="absolute inset-x-0 top-0 h-px origin-left bg-[var(--text-main)]/80"
      />
      <motion.p
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        transition={timing(0.8, 0.25)}
        className="flex items-baseline gap-3 text-[11px] font-semibold uppercase tracking-[3px] text-[var(--text-light)]"
      >
        <span className="font-[family-name:var(--font-playfair)] text-base italic normal-case tracking-normal text-[var(--primary-color)]">
          {numeral}.
        </span>
        {eyebrow}
      </motion.p>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
        {/* Mép che: tiêu đề trượt lên từ bên dưới khung overflow-hidden */}
        <div className="overflow-hidden pb-1">
          <motion.h2
            variants={{ hidden: { y: "105%" }, visible: { y: 0 } }}
            transition={timing(1.1, 0.3)}
            className="max-w-2xl font-[family-name:var(--font-playfair)] text-[30px] font-semibold leading-tight text-[var(--text-main)] sm:text-[40px]"
          >
            {title}
          </motion.h2>
        </div>
        {description ? (
          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            transition={timing(1, 0.5)}
            className="max-w-lg text-[15px] leading-7 text-[var(--text-light)] lg:justify-self-end"
          >
            {description}
          </motion.p>
        ) : null}
      </div>
    </motion.header>
  );
}
