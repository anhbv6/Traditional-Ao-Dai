'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Huy hiệu số lượng dùng chung cho các icon ở header (yêu thích, giỏ hàng…) — cùng hình, cùng vị trí.
 *
 * - Viên tròn đỏ đô, viền nền trang tách khỏi icon, số dạng lining (cao đều, thẳng hàng).
 * - Đổi số: số cũ trượt ra / số mới trượt vào theo chiều tăng (lên) hoặc giảm (xuống).
 * - Bên cạnh nổi "+1" / "−1" (đúng độ chênh) bay lên rồi mờ dần biến mất.
 * - `ready = false` trong lúc store đang nạp từ localStorage → không hiện "+N" giả khi vừa tải trang.
 *
 * Đặt trong phần tử `position: relative` (khung icon 44×44).
 */
interface CountBadgeProps {
  count: number;
  /** Store đã nạp xong dữ liệu chưa (VD useCartHydrated()) — chưa xong thì không phát "+N" */
  ready?: boolean;
  className?: string;
}

type Delta = { id: number; value: number };

const EASE = [0.22, 1, 0.36, 1] as const;

const digitVariants = {
  enter: (direction: number) => ({ y: direction >= 0 ? 10 : -10, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (direction: number) => ({ y: direction >= 0 ? -10 : 10, opacity: 0 }),
};

export function CountBadge({ count, ready = true, className }: CountBadgeProps) {
  /* Theo dõi số trước đó ngay trong lúc render (mẫu "lưu giá trị trước vào state" của React) để tính độ chênh.
     Chỉ phát "+N" khi store đã sẵn sàng ở CẢ lần render trước lẫn lần này → bỏ qua đợt nạp từ localStorage. */
  const [tracked, setTracked] = useState({ prev: count, ready, seq: 0, direction: 0, deltas: [] as Delta[] });

  if (count !== tracked.prev || ready !== tracked.ready) {
    const emit = count !== tracked.prev && tracked.ready && ready;
    const value = count - tracked.prev;
    setTracked({
      prev: count,
      ready,
      seq: emit ? tracked.seq + 1 : tracked.seq,
      direction: count !== tracked.prev ? Math.sign(value) : tracked.direction,
      deltas: emit ? [...tracked.deltas, { id: tracked.seq + 1, value }] : tracked.deltas,
    });
  }

  const removeDelta = (id: number) =>
    setTracked((state) => ({ ...state, deltas: state.deltas.filter((delta) => delta.id !== id) }));

  const display = count > 99 ? '99+' : String(count);

  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute right-0.5 top-1', className)}>
      <AnimatePresence initial={false}>
        {count > 0 ? (
          <motion.span
            key="badge"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 480, damping: 24 }}
            className="relative grid h-[18px] min-w-[18px] place-items-center overflow-hidden rounded-full bg-[var(--primary-color)] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[var(--bg-main)] [font-variant-numeric:lining-nums_tabular-nums]"
          >
            <AnimatePresence mode="popLayout" initial={false} custom={tracked.direction}>
              <motion.span
                key={display}
                custom={tracked.direction}
                variants={digitVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: EASE }}
                className="block"
              >
                {display}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        ) : null}
      </AnimatePresence>

      {/* "+1" / "−1" bay lên rồi tắt */}
      <AnimatePresence>
        {tracked.deltas.map((delta) => (
          <motion.span
            key={delta.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: [0, 1, 1, 0], y: [4, -2, -8, -16] }}
            transition={{ duration: 1.2, times: [0, 0.2, 0.6, 1], ease: 'easeOut' }}
            onAnimationComplete={() => removeDelta(delta.id)}
            className={cn(
              'absolute left-full top-0 ml-1 whitespace-nowrap text-[11px] font-bold leading-none [font-variant-numeric:lining-nums]',
              delta.value > 0 ? 'text-[var(--primary-ink)]' : 'text-[var(--text-light)]',
            )}
          >
            {delta.value > 0 ? `+${delta.value}` : `−${Math.abs(delta.value)}`}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
