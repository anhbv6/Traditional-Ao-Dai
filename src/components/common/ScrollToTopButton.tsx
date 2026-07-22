'use client';

import { useSyncExternalStore } from 'react';
import { ArrowUp } from 'lucide-react';

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
      className={[
        'cursor-pointer fixed bottom-5 right-5 z-40 grid size-8 place-items-center rounded-full bg-[var(--primary-color)] text-white shadow-[0_14px_35px_rgba(42,37,37,0.18)] transition duration-300 sm:bottom-7 sm:right-7 sm:size-10',
        'hover:bg-[var(--text-main)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-color)]',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0',
      ].join(' ')}
    >
      <ArrowUp size={18} strokeWidth={2} />
    </button>
  );
}
