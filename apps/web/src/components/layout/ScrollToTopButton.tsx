'use client';

import { useSyncExternalStore } from 'react';
import { ArrowUp } from 'lucide-react';
import { useHasBottomBar } from '@/hooks/useHasBottomBar';
import { cn } from '@/lib/utils';
import { FLOATING_BUTTON_CLASS } from './floatingButton';

const SCROLL_THRESHOLD = 320;
const SCROLL_DURATION = 1800;

function subscribe(callback: () => void) {
  window.addEventListener('scroll', callback, { passive: true });
  window.addEventListener('resize', callback);

  return () => {
    window.removeEventListener('scroll', callback);
    window.removeEventListener('resize', callback);
  };
}

function getSnapshot() {
  return window.scrollY > SCROLL_THRESHOLD;
}

function getServerSnapshot() {
  return false;
}

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export function ScrollToTopButton() {
  const isVisible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  /** Trang có thanh cố định ở đáy (mobile / tablet) — đẩy nút lên để không đè */
  const hasBottomBar = useHasBottomBar();

  function handleClick() {
    const startY = window.scrollY;
    const startTime = window.performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / SCROLL_DURATION, 1);
      const easedProgress = easeInOutCubic(progress);

      window.scrollTo(0, startY * (1 - easedProgress));

      if (progress < 1) {
        window.requestAnimationFrame(animate);
      }
    }

    window.requestAnimationFrame(animate);
  }

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={handleClick}
      className={cn(
        FLOATING_BUTTON_CLASS,
        // Ghi đè transition chung: thêm mờ + trượt khi hiện / ẩn
        'fixed z-40 transition-[opacity,translate,background-color] duration-300',
        // Trên cụm nút chat (ChatDock: đáy + 2 nút size-11 + gap-3), cách nút chat trên cùng đúng gap-3 (0.75rem)
        // để cả cột 3 nút cách đều: 1.75 + 2×2.75 + 0.75 + 0.75 = 8.75rem (thanh đáy: 6 + … = 13rem), cùng lề phải
        hasBottomBar ? 'bottom-[13rem] right-5 sm:right-7 lg:bottom-[8.75rem]' : 'bottom-[8.75rem] right-5 sm:right-7',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      )}
    >
      <ArrowUp size={18} strokeWidth={1.8} />
    </button>
  );
}
