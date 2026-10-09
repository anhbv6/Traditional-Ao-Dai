'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useInView } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { SectionHeading } from './SectionHeading';
import { mockArticles, NewsCard } from '@/features/news';

const VISIBLE_COUNT = 8;
/** Thời gian dừng ở mỗi slide trước khi tự trượt */
const AUTOPLAY_MS = 5000;

/**
 * Bản tin dạng slider trượt: kéo / vuốt được, có nút điều hướng và tự trượt chậm.
 * Tự dừng khi rê chuột, khi đang kéo, khi slider ra khỏi màn hình hoặc tab bị ẩn.
 */
export function ArticleNews() {
  const t = useTranslations('HomePage.articleNews');
  const locale = useLocale() as 'vi' | 'en';
  const articles = mockArticles.slice(0, VISIBLE_COUNT);

  // duration cao hơn mặc định (25) để chuyển slide chậm, mềm hơn
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true, duration: 40 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(viewportRef, { amount: 0.4 });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect).on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect).off('reInit', onSelect);
    };
  }, [emblaApi]);

  // Tự trượt: effect chạy lại mỗi khi đổi slide (selectedIndex) nên mỗi slide luôn dừng đủ AUTOPLAY_MS
  useEffect(() => {
    if (!emblaApi || !isInView || isHovering) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') emblaApi.scrollNext();
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [emblaApi, isInView, isHovering, selectedIndex]);

  const total = articles.length;
  const pad = (value: number) => String(value).padStart(2, '0');

  return (
    <section className="mx-auto w-full max-w-[1440px] overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:px-10 xl:px-16">
      <SectionHeading index="06" eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

      <div
        ref={viewportRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onFocusCapture={() => setIsHovering(true)}
        onBlurCapture={() => setIsHovering(false)}
      >
        <div ref={emblaRef} className="cursor-grab overflow-hidden active:cursor-grabbing" aria-roledescription="carousel">
          <div className="-ml-5 flex touch-pan-y lg:-ml-7">
            {articles.map((article, i) => (
              <div
                key={article.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${total}`}
                className="min-w-0 shrink-0 grow-0 basis-[85%] pl-5 sm:basis-1/2 lg:basis-1/3 lg:pl-7"
              >
                <NewsCard
                  slug={article.slug}
                  category={article.category[locale] || article.category.vi}
                  title={article.title[locale] || article.title.vi}
                  description={article.description[locale] || article.description.vi}
                  dateShort={article.dateShort[locale] || article.dateShort.vi}
                  dateLong={article.dateLong[locale] || article.dateLong.vi}
                  imageSrc={article.imageSrc}
                  readTime={article.readTime[locale] || article.readTime.vi}
                  readMoreLabel={t('readMore')}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Thanh điều khiển: bộ đếm + tiến trình | nút trượt + xem tất cả */}
        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <span className="font-[family-name:var(--font-playfair)] text-sm text-[var(--text-light)]">
              <span className="text-lg font-semibold text-[var(--primary-color)]">{pad(selectedIndex + 1)}</span> / {pad(total)}
            </span>
            <span className="relative h-px w-32 bg-[var(--border)] sm:w-48">
              <span
                className="absolute inset-y-0 left-0 bg-[var(--primary-color)] transition-[width] duration-700 ease-out"
                style={{ width: `${((selectedIndex + 1) / total) * 100}%` }}
              />
            </span>
          </div>

          <div className="flex items-center justify-between gap-6 sm:justify-end">
            <Link
              href="/news"
              className="group inline-flex items-center gap-3 border-b border-[var(--primary-color)]/40 pb-1 text-xs font-semibold uppercase tracking-[2px] text-[var(--primary-color)] transition-colors hover:border-[var(--primary-color)]"
            >
              {t('viewAll')}
              <ArrowRight size={15} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={scrollPrev}
                aria-label={t('prev')}
                className="flex size-11 cursor-pointer items-center justify-center border border-[var(--primary-color)]/30 text-[var(--primary-color)] transition-colors hover:bg-[var(--primary-color)] hover:text-white"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                aria-label={t('next')}
                className="flex size-11 cursor-pointer items-center justify-center border border-[var(--primary-color)]/30 text-[var(--primary-color)] transition-colors hover:bg-[var(--primary-color)] hover:text-white"
              >
                <ChevronRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default ArticleNews;
