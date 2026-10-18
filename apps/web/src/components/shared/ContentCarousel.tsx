'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useInView } from 'motion/react';
import { cn } from '@/lib/utils';
import { SliderNav } from '@/components/shared/SliderNav';

/** Thời gian dừng mặc định ở mỗi vị trí trước khi tự trôi sang thẻ kế tiếp */
const DEFAULT_AUTOPLAY_MS = 4500;

interface ContentCarouselProps<T> {
  items: T[];
  title: string;
  /** Nhãn nhỏ phía trên tiêu đề (tuỳ chọn) */
  eyebrow?: string;
  getKey: (item: T) => string | number;
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Độ rộng mỗi thẻ theo mốc màn hình (Tailwind basis-*) */
  slideClassName?: string;
  /** Đặt 0 để tắt tự trôi */
  autoplayMs?: number;
  className?: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Băng chuyền nội dung dùng chung (sản phẩm liên quan, bài viết liên quan...):
 * - Kéo chuột / vuốt cảm ứng (Embla tự chặn click sau khi kéo nên không mở nhầm thẻ).
 * - Tự trôi khi nằm trong khung nhìn; dừng khi rê chuột, focus bàn phím, đang kéo hoặc tab bị ẩn.
 * - Đầu khối: tiêu đề bên trái, bộ đếm "01 / 06" + nút Trước / Sau bên phải;
 *   cuối khối: thanh tiến trình mảnh trượt theo vị trí. Đủ chỗ hiển thị hết thì ẩn điều hướng.
 */
export function ContentCarousel<T>({
  items,
  title,
  eyebrow,
  getKey,
  renderItem,
  slideClassName = 'basis-[78%] sm:basis-1/2 lg:basis-1/3',
  autoplayMs = DEFAULT_AUTOPLAY_MS,
  className,
}: ContentCarouselProps<T>) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true, duration: 36 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.35 });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      setSnapCount(emblaApi.scrollSnapList().length);
    };
    const onPointerDown = () => setIsPaused(true);
    const onSettle = () => setIsPaused(false);
    onSelect();
    emblaApi.on('select', onSelect).on('reInit', onSelect).on('pointerDown', onPointerDown).on('settle', onSettle);
    return () => {
      emblaApi.off('select', onSelect).off('reInit', onSelect).off('pointerDown', onPointerDown).off('settle', onSettle);
    };
  }, [emblaApi]);

  const canSlide = snapCount > 1;

  // Tự trôi: effect chạy lại mỗi khi đổi vị trí nên mỗi thẻ luôn dừng đủ autoplayMs
  useEffect(() => {
    if (!emblaApi || !canSlide || autoplayMs <= 0 || !isInView || isPaused) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') emblaApi.scrollNext();
    }, autoplayMs);
    return () => window.clearTimeout(timer);
  }, [emblaApi, canSlide, autoplayMs, isInView, isPaused, selectedIndex]);

  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={className}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="flex items-end justify-between gap-4 border-b border-[var(--text-main)]/80 pb-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[3px] text-[var(--accent-color)] sm:text-[11px]">{eyebrow}</p>
          ) : null}
          <h2 className="font-[family-name:var(--font-playfair)] text-[1.375rem] font-semibold leading-tight text-[var(--primary-ink)] sm:text-2xl lg:text-[1.75rem]">
            {title}
          </h2>
        </div>

        {canSlide ? (
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <p className="hidden text-xs tabular-nums tracking-[1.5px] text-[var(--text-light)] sm:block" aria-live="polite">
              <span className="font-semibold text-[var(--primary-ink)]">{pad(selectedIndex + 1)}</span>
              <span className="mx-1.5 text-[var(--border)]">/</span>
              {pad(snapCount)}
            </p>
            <SliderNav onPrev={scrollPrev} onNext={scrollNext} />
          </div>
        ) : null}
      </div>

      {/* Viewport: overflow ẩn; con trỏ "nắm" gợi ý kéo được */}
      <div
        ref={emblaRef}
        className={cn('mt-6 overflow-hidden sm:mt-8', canSlide && 'cursor-grab active:cursor-grabbing')}
        aria-roledescription="carousel"
        aria-label={title}
      >
        <div className="-ml-4 flex touch-pan-y sm:-ml-5 xl:-ml-6">
          {items.map((item, index) => (
            <div
              key={getKey(item)}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${items.length}`}
              className={cn('min-w-0 shrink-0 grow-0 pl-4 sm:pl-5 xl:pl-6', slideClassName)}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>

      {/* Thanh tiến trình: đoạn đỏ đô trượt theo vị trí hiện tại */}
      {canSlide ? (
        <div className="relative mt-6 h-px overflow-hidden bg-[var(--border)] sm:mt-8" aria-hidden="true">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--primary-color)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${100 / snapCount}%`, transform: `translateX(${selectedIndex * 100}%)` }}
          />
        </div>
      ) : null}
    </section>
  );
}
