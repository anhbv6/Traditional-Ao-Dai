'use client';

import React, { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

export interface CarouselProps {
  items?: any[];
  renderItem?: (item: any, index: number) => React.ReactNode;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
}

export default function Carousel({
  items = [],
  renderItem,
  autoplay = true,
  autoplayDelay = 3000,
  loop = true,
}: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: loop,
    align: 'start',
    skipSnaps: true,
    dragFree: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', () => {
      onSelect();
      setScrollSnaps(emblaApi.scrollSnapList());
    });
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

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
      {scrollSnaps.length > 1 && (
        <div className="flex flex-col items-center gap-4">
          {/* Interactive Slide Dots */}
          <div className="flex gap-2">
            {scrollSnaps.map((_, index) => (
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
