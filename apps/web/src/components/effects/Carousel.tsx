'use client';

import React, { useEffect, useCallback, useSyncExternalStore } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

export interface CarouselProps<T extends { id?: string | number }> {
  items?: T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
}

export default function Carousel<T extends { id?: string | number }>({
  items = [],
  renderItem,
  autoplay = true,
  autoplayDelay = 3000,
  loop = true,
}: CarouselProps<T>) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: loop,
    align: 'start',
    skipSnaps: true,
    dragFree: true,
  });

  // Đồng bộ trạng thái slide từ Embla (hệ thống bên ngoài React) qua useSyncExternalStore
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!emblaApi) return () => {};
      emblaApi.on('select', onChange);
      emblaApi.on('reInit', onChange);
      return () => {
        emblaApi.off('select', onChange);
        emblaApi.off('reInit', onChange);
      };
    },
    [emblaApi]
  );
  const selectedIndex = useSyncExternalStore(subscribe, () => emblaApi?.selectedScrollSnap() ?? 0, () => 0);
  const snapCount = useSyncExternalStore(subscribe, () => emblaApi?.scrollSnapList().length ?? 0, () => 0);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  // Autoplay effect
  useEffect(() => {
    if (!emblaApi || !autoplay) return;

    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else if (loop) {
        emblaApi.scrollTo(0);
      }
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [emblaApi, autoplay, autoplayDelay, loop]);

  if (!items || items.length === 0 || !renderItem) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden py-4">
      {/* Embla Viewport */}
      <div className="overflow-hidden py-7" ref={emblaRef}>
        <div className="flex -ml-3 sm:-ml-6 backface-hidden touch-pan-y">
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className="min-w-0 flex-[0_0_50%] pl-3 sm:pl-6 lg:flex-[0_0_25%]"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>

      {/* Progress Scroll & Dot Indicator */}
      {snapCount > 1 && (
        <div className="flex flex-col items-center gap-4">
          {/* Interactive Slide Dots */}
          <div className="flex gap-2">
            {Array.from({ length: snapCount }, (_, index) => (
              <button
                type="button"
                key={index}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={selectedIndex === index}
                className={`h-1.5 rounded-full cursor-pointer border-0 p-0 appearance-none transition-all duration-300 select-none ${
                  selectedIndex === index
                    ? 'w-5 bg-[var(--primary-color)]'
                    : 'w-1.5 bg-[var(--accent-color)]/30 hover:bg-[var(--accent-color)]/60'
                }`}
                onClick={() => scrollTo(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
