"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { MAX_LINE_QUANTITY } from "../utils/pricing";

interface QuantityStepperProps {
  value: number;
  onChange: (quantity: number) => void;
  labels: { decrease: string; increase: string; quantity: string; maxReached: string };
}

/**
 * Ô số lượng vuông góc: nút −/+ (số nhảy lên/xuống theo chiều thay đổi) và ô nhập tay.
 * Ô nhập dùng `defaultValue` + `key` theo giá trị: gõ tự do (kể cả xóa trắng), chỉ chốt khi rời ô / Enter.
 */
export function QuantityStepper({ value, onChange, labels }: QuantityStepperProps) {
  const atMax = value >= MAX_LINE_QUANTITY;

  /** Chốt giá trị gõ tay: rỗng / 0 -> giữ nguyên, vượt giới hạn -> ép về tối đa; luôn hiển thị lại số hợp lệ */
  const commit = (input: HTMLInputElement) => {
    const parsed = parseInt(input.value.replace(/\D/g, ""), 10) || value;
    const next = Math.min(MAX_LINE_QUANTITY, Math.max(1, parsed));
    input.value = String(next);
    if (next !== value) onChange(next);
  };

  return (
    <div className="inline-flex h-8 items-stretch border border-[var(--border)] bg-white sm:h-9" title={atMax ? labels.maxReached : undefined}>
      <button
        type="button"
        aria-label={labels.decrease}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        className="grid w-7 cursor-pointer place-items-center text-[var(--text-light)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-color)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent sm:w-8"
      >
        <Minus size={12} />
      </button>
      <div className="relative w-8 overflow-hidden border-x border-[var(--border)] sm:w-10">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.input
            key={value}
            type="text"
            inputMode="numeric"
            aria-label={labels.quantity}
            defaultValue={value}
            onBlur={(e) => commit(e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full bg-transparent text-center text-[12px] font-semibold text-[var(--text-main)] outline-none focus:bg-[var(--bg-main)] sm:text-[13px]"
          />
        </AnimatePresence>
      </div>
      <button
        type="button"
        aria-label={labels.increase}
        onClick={() => onChange(value + 1)}
        disabled={atMax}
        className="grid w-7 cursor-pointer place-items-center text-[var(--text-light)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-color)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent sm:w-8"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}
