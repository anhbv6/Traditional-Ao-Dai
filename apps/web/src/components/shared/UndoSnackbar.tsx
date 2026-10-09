"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

/** Thời gian (ms) mặc định cho phép hoàn tác */
export const UNDO_TIMEOUT = 5000;

interface UndoSnackbarProps {
  /** Khóa của lần hoàn tác hiện tại; `null` -> ẩn. Đổi khóa -> thanh hiện lại & chạy lại vạch thời gian */
  activeKey: string | null;
  message: string;
  undoLabel: string;
  closeLabel: string;
  onUndo: () => void;
  onDismiss: () => void;
  /** Phải khớp với thời gian hẹn giờ phía gọi */
  duration?: number;
}

/** Thanh hoàn tác trượt lên từ đáy màn hình, vạch tiến trình co dần theo thời gian còn lại (vuông góc, nền tối) */
export function UndoSnackbar({
  activeKey,
  message,
  undoLabel,
  closeLabel,
  onUndo,
  onDismiss,
  duration = UNDO_TIMEOUT,
}: UndoSnackbarProps) {
  return (
    <AnimatePresence>
      {activeKey ? (
        <motion.div
          key={activeKey}
          role="status"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-sm overflow-hidden bg-[var(--text-main)] text-white shadow-lg sm:bottom-6 sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2"
        >
          <div className="flex items-center gap-3 py-2.5 pl-4 pr-2">
            <p className="min-w-0 flex-1 truncate text-[12px]">{message}</p>
            <button
              type="button"
              onClick={onUndo}
              className="shrink-0 cursor-pointer px-2 py-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--accent-color)] transition-colors hover:text-white"
            >
              {undoLabel}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label={closeLabel}
              className="grid size-7 shrink-0 cursor-pointer place-items-center text-white/60 transition-colors hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          <motion.span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[var(--accent-color)]"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
