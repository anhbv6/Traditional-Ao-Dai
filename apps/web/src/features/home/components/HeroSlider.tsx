'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { useInView } from 'motion/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * Danh sách ảnh của slider Hero — thêm / đổi ảnh tại đây.
 * `key` trỏ tới chữ trong messages: HomePage.hero.slides.<key>.{alt, caption}.
 * Ảnh dọc tỉ lệ ~3:4; `position` = object-position để không cắt mặt chủ thể.
 */
const HERO_SLIDES = [
  { key: 'lotus', src: '/images/ex3.jpg', position: '50% 25%' },
  { key: 'market', src: '/images/login1.jpg', position: '50% 35%' },
  { key: 'lily', src: '/images/login2.jpg', position: '50% 30%' },
] as const;

/** Thời gian dừng ở mỗi ảnh trước khi tự trượt */
const AUTOPLAY_MS = 6000;

/**
 * Slider ảnh cột phải của Hero: vuốt / kéo được, tự trượt, có nút Trước / Sau.
 * - Nhịp tự trượt do thanh tiến trình CSS của ảnh đang chọn điều khiển (onAnimationEnd → sang ảnh kế),
 *   nên tạm dừng chỉ cần `animation-play-state: paused`: khi rê chuột, khi slider ra khỏi màn hình.
 * - Trang trí tối giản: khung viền mảnh lệch phía sau, thẻ chú thích đè mép, số thứ tự kiểu tạp chí.
 */
export function HeroSlider() {
  const t = useTranslations('HomePage.hero.slides');
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 38 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { amount: 0.4 });
  const isPlaying = isInView && !isHovering;

  const total = HERO_SLIDES.length;

  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect).on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect).off('reInit', onSelect);
    };
  }, [emblaApi]);

  return (
    <div
      ref={rootRef}
      className="relative size-full animate-fade-in-up"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Khung viền mảnh lệch phía sau — tạo chiều sâu, gợi khung tranh */}
      <div aria-hidden="true" className="absolute inset-0 translate-x-4 translate-y-4 border border-[var(--accent-color)]/60 sm:translate-x-5 sm:translate-y-5" />

      {/* Ảnh trượt */}
      <div
        ref={emblaRef}
        className="relative size-full cursor-grab overflow-hidden bg-[var(--bg-secondary)] shadow-[0_40px_80px_-30px_rgba(128,0,32,0.35)] active:cursor-grabbing"
        role="region"
        aria-roledescription="carousel"
        aria-label={t('label')}
      >
        <div className="flex h-full">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={slide.key}
              className="relative h-full min-w-0 flex-[0_0_100%] overflow-hidden"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${total}`}
            >
              <Image
                src={slide.src}
                alt={t(`${slide.key}.alt`)}
                fill
                draggable={false}
                sizes="(max-width: 1024px) 90vw, 500px"
                /* Ảnh đầu là LCP → tải ngay; các ảnh sau tải lười */
                {...(index === 0 ? { loading: 'eager', fetchPriority: 'high' } : {})}
                /* Ảnh đang chọn thu nhẹ từ 1.08 về 1 — chuyển cảnh mềm như máy quay lùi */
                className={cn(
                  'select-none object-cover transition-transform duration-[2400ms] ease-out motion-reduce:transition-none',
                  index === selectedIndex ? 'scale-100' : 'scale-[1.08]',
                )}
                style={{ objectPosition: slide.position }}
              />
            </div>
          ))}
        </div>

        {/* Phủ tối nhẹ phía dưới cho thanh tiến trình nổi trên ảnh sáng */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Thanh tiến trình: mỗi ảnh một vạch, vạch đang chọn chạy đầy rồi tự sang ảnh kế */}
        <div className="absolute inset-x-5 bottom-5 flex gap-2 sm:inset-x-6">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`${index + 1} / ${total}`}
              aria-current={index === selectedIndex}
              className="relative h-6 flex-1 cursor-pointer"
            >
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 overflow-hidden bg-white/35">
                {index === selectedIndex ? (
                  <span
                    key={selectedIndex}
                    className="absolute inset-0 origin-left bg-white"
                    onAnimationEnd={scrollNext}
                    style={{
                      animation: `progress-fill ${AUTOPLAY_MS}ms linear forwards`,
                      animationPlayState: isPlaying ? 'running' : 'paused',
                    }}
                  />
                ) : index < selectedIndex ? (
                  <span className="absolute inset-0 bg-white/70" />
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
