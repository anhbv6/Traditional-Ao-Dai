"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/routing";

const EASE = [0.22, 1, 0.36, 1] as const;

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
  /** Đích của nút kêu gọi hành động */
  href?: string;
}

/** Trạng thái trống dùng chung: khung vuông viền mảnh vẽ dần, icon "thở" nhẹ, chữ hiện lần lượt */
export function EmptyState({ icon: Icon, title, description, action, href = "/products" }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mx-auto flex max-w-md flex-col items-center border-y border-[var(--border)] px-4 py-14 text-center sm:py-20"
    >
      <div className="relative grid size-16 place-items-center sm:size-20">
        {/* Khung vuông tự vẽ viền */}
        <svg className="absolute inset-0 size-full" viewBox="0 0 80 80" fill="none" aria-hidden="true">
          <motion.rect
            x="0.5"
            y="0.5"
            width="79"
            height="79"
            stroke="var(--primary-color)"
            strokeOpacity="0.35"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: EASE }}
          />
        </svg>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [1, 1.12, 1], opacity: 1 }}
          transition={{
            opacity: { duration: 0.5, delay: 0.3 },
            scale: { duration: 2.4, delay: 0.6, repeat: Infinity, ease: "easeInOut" },
          }}
          className="text-[var(--primary-color)]"
        >
          <Icon size={26} strokeWidth={1.3} />
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
        className="mt-6 text-lg font-semibold text-[var(--text-main)] sm:text-xl"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
        className="mt-2 max-w-xs text-[13px] leading-6 text-[var(--text-light)]"
      >
        {description}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
        className="mt-7"
      >
        <Link
          href={href}
          className="group inline-flex min-h-10 items-center gap-2 bg-[var(--primary-color)] px-6 text-[11px] font-semibold uppercase tracking-[2px] text-white transition-colors duration-300 hover:bg-[#2A0A12]"
        >
          {action}
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
