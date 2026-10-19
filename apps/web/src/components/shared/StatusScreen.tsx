"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ActionLink } from "./ActionLink";
import { EmptyStateLinks } from "./EmptyState";
import { SectionOrnament } from "./SectionOrnament";

const EASE = [0.22, 1, 0.36, 1] as const;

interface StatusScreenProps {
  /** Mã trạng thái hiển thị lớn (VD "404") — chữ số giữa được thay bằng hoạ tiết kim chỉ */
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  /** Gợi ý đi tiếp dạng chip */
  suggestions?: { title: string; links: { label: string; href: string }[] };
}

/** Chữ số giữa: thoi đôi xoay chậm + kim xuyên chỉ — "đường may bị lạc" */
function NeedleOrnament({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 120 160"
      fill="none"
      aria-hidden="true"
      className="h-[1em] w-[0.75em] text-[var(--primary-ink)]"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
    >
      {/* Thoi ngoài xoay chậm */}
      <motion.path
        d="M60 8 L112 80 L60 152 L8 80 Z"
        stroke="currentColor"
        strokeWidth="3"
        style={{ originX: "60px", originY: "80px" }}
        animate={reduceMotion ? undefined : { rotate: [0, 6, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Thoi trong vẽ dần */}
      <motion.path
        d="M60 34 L94 80 L60 126 L26 80 Z"
        stroke="var(--accent-color)"
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, delay: 0.5, ease: EASE }}
      />
      {/* Kim may chéo qua giữa + sợi chỉ lượn */}
      <motion.g
        animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M34 112 L88 46" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="85" cy="50" rx="3" ry="5.5" transform="rotate(40 85 50)" stroke="currentColor" strokeWidth="1.8" />
        <motion.path
          d="M85 50 C104 34, 112 70, 92 92 S56 122, 70 140"
          stroke="var(--accent-color)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1 0"
          initial={{ pathLength: 0 }}
          animate={reduceMotion ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 3.6, repeat: Infinity, ease: "easeInOut", times: [0, 0.6, 1] }}
        />
      </motion.g>
    </motion.svg>
  );
}

/**
 * Màn trạng thái dùng chung (404, 403…) theo ngôn ngữ storefront:
 * - Mã lớn Playfair: các chữ số trồi lên lần lượt, chữ số giữa là hoạ tiết thoi + kim chỉ (xoay / bay nhẹ, chỉ tự "khâu").
 * - Đường may nét đứt tự vẽ bên dưới → eyebrow → tiêu đề → mô tả → hoạ tiết phân cách → nút (ActionLink) + link phụ
 *   → gợi ý đi tiếp (chip).
 * - Tôn trọng "giảm chuyển động": bỏ chuyển động lặp, chỉ còn hiện dần.
 */
export function StatusScreen({ code, eyebrow, title, description, primaryAction, secondaryAction, suggestions }: StatusScreenProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const digits = code.split("");
  const middle = Math.floor(digits.length / 2);

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-12 text-center sm:py-16">
      {/* Mã trạng thái */}
      <p aria-hidden="true" className="flex items-center gap-[0.12em] font-[family-name:var(--font-playfair)] text-[7rem] font-semibold leading-none text-[var(--primary-ink)] sm:text-[10rem]">
        {digits.map((digit, index) =>
          index === middle ? (
            <NeedleOrnament key={index} reduceMotion={reduceMotion} />
          ) : (
            <motion.span
              key={index}
              className="inline-block"
              initial={{ opacity: 0, y: "40%" }}
              animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: ["40%", "0%", "-3%", "0%"] }}
              transition={{ duration: 1.2, delay: 0.1 + index * 0.12, ease: EASE }}
            >
              {digit}
            </motion.span>
          ),
        )}
      </p>

      {/* Đường may nét đứt tự vẽ */}
      <svg viewBox="0 0 320 12" className="mt-2 h-3 w-64 sm:w-80" fill="none" aria-hidden="true">
        <motion.path
          d="M2 6 Q 80 -2 160 6 T 318 6"
          stroke="var(--primary-color)"
          strokeOpacity="0.45"
          strokeWidth="1.5"
          strokeDasharray="6 5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, delay: 0.6, ease: EASE }}
        />
      </svg>

      <motion.p {...reveal(0.5)} className="mt-8 text-[11px] font-semibold uppercase tracking-[3px] text-[var(--accent-color)]">
        {eyebrow}
      </motion.p>
      <motion.h1
        {...reveal(0.6)}
        className="mt-3 font-[family-name:var(--font-playfair)] text-[1.75rem] font-semibold leading-tight text-[var(--text-main)] sm:text-[2.5rem]"
      >
        {title}
      </motion.h1>
      <motion.p {...reveal(0.7)} className="mt-4 max-w-lg text-[15px] leading-7 text-[var(--text-light)]">
        {description}
      </motion.p>
      <motion.div {...reveal(0.75)}>
        <SectionOrnament className="mt-7" />
      </motion.div>

      <motion.div {...reveal(0.85)} className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <ActionLink href={primaryAction.href} variant="confirm" size="lg" icon={<ArrowRight />} iconPosition="end">
          {primaryAction.label}
        </ActionLink>
        {secondaryAction ? (
          <Link
            href={secondaryAction.href}
            className="border-b border-[var(--primary-color)]/30 pb-0.5 text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
          >
            {secondaryAction.label}
          </Link>
        ) : null}
      </motion.div>

      {suggestions ? (
        <motion.div {...reveal(1)} className="mt-12 w-full">
          <EmptyStateLinks title={suggestions.title} links={suggestions.links} />
        </motion.div>
      ) : null}
    </div>
  );
}
