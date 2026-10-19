"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

interface StepPanelProps {
  /** Số thứ tự (1, 2, 3…) — hiện dạng "01" cạnh tiêu đề */
  index: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Hàng nút cuối khối (quay lại / tiếp tục) */
  actions?: React.ReactNode;
  /** Nội dung nhỏ bên phải tiêu đề (VD giá cộng thêm, trạng thái đã chọn) */
  aside?: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * Khung một bước / một phần có đánh số — dùng chung cho Thanh toán (3 bước) và May áo dài theo yêu cầu.
 * Vuông góc, viền mảnh trên nền card: số "01" Playfair nghiêng + tiêu đề → mô tả → nội dung → hàng nút (ngăn vạch mảnh).
 * Hiện lên nhẹ nhàng khi xuất hiện.
 */
export function StepPanel({ index, title, description, children, actions, aside, id, className }: StepPanelProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn("scroll-mt-28 bg-[var(--bg-card)] ring-1 ring-[var(--border)]", className)}
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-6 sm:px-8 sm:pt-8">
        <div className="min-w-0">
          <h2 className="m-0 flex items-baseline gap-3 font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
            <span className="text-base italic text-[var(--accent-color)]">{String(index).padStart(2, "0")}</span>
            {title}
          </h2>
          {description ? <p className="mt-1.5 text-[13px] leading-6 text-[var(--text-light)]">{description}</p> : null}
        </div>
        {aside ? <div className="shrink-0 pt-1 text-right text-xs text-[var(--text-light)]">{aside}</div> : null}
      </header>

      <div className="px-5 pb-6 pt-6 sm:px-8 sm:pb-8">{children}</div>

      {actions ? (
        <footer className="flex flex-col-reverse gap-3 border-t border-[var(--border)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          {actions}
        </footer>
      ) : null}
    </motion.section>
  );
}
