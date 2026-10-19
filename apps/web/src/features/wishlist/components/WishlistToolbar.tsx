"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/shared/ActionButton";
import { type WishlistSortKey } from "../types/wishlist.types";

const SORT_KEYS: WishlistSortKey[] = ["recent", "priceAsc", "priceDesc"];
const EASE = [0.22, 1, 0.36, 1] as const;

interface WishlistToolbarProps {
  sortKey: WishlistSortKey;
  onSortChange: (key: WishlistSortKey) => void;
  readyCount: number;
  onAddAll: () => void;
  onClearAll: () => void;
  labels: {
    sort: string;
    sortOptions: Record<WishlistSortKey, string>;
    addAll: string;
    clearAll: string;
    confirmClear: string;
    cancel: string;
  };
}

/**
 * Thanh công cụ: sắp xếp (gạch chân trượt theo lựa chọn) + thêm tất cả vào giỏ + xóa tất cả (xác nhận tại chỗ, không mở hộp thoại).
 * Nút hành động dùng ActionButton chung (màu / hiệu ứng quét đồng bộ toàn storefront).
 */
export function WishlistToolbar({ sortKey, onSortChange, readyCount, onAddAll, onClearAll, labels }: WishlistToolbarProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden text-[10px] uppercase tracking-[2px] text-[var(--text-light)] sm:inline">{labels.sort}</span>
        <div className="flex items-center gap-4" role="radiogroup" aria-label={labels.sort}>
          {SORT_KEYS.map((key) => {
            const active = key === sortKey;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSortChange(key)}
                className={`relative cursor-pointer pb-1 text-[11px] uppercase tracking-[1.5px] transition-colors duration-300 sm:text-xs ${
                  active ? "text-[var(--primary-ink)]" : "text-[var(--text-light)] hover:text-[var(--text-main)]"
                }`}
              >
                {labels.sortOptions[key]}
                {active ? (
                  <motion.span
                    layoutId="wishlist-sort-underline"
                    className="absolute inset-x-0 -bottom-px h-px bg-[var(--primary-color)]"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {confirming ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="flex items-center gap-2"
            >
              <ActionButton variant="cancel" size="sm" onClick={() => setConfirming(false)}>
                {labels.cancel}
              </ActionButton>
              <ActionButton
                variant="custom"
                size="sm"
                colors={{ bg: "var(--destructive)", text: "#FFFFFF", border: "var(--destructive)" }}
                onClick={() => {
                  setConfirming(false);
                  onClearAll();
                }}
              >
                {labels.confirmClear}
              </ActionButton>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="flex items-center gap-2"
            >
              <ActionButton variant="cancel" size="sm" icon={<Trash2 strokeWidth={1.6} />} onClick={() => setConfirming(true)}>
                {labels.clearAll}
              </ActionButton>
              {readyCount > 0 ? (
                <ActionButton variant="confirm" size="sm" icon={<ShoppingBag strokeWidth={1.6} />} onClick={onAddAll}>
                  {labels.addAll}
                </ActionButton>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
