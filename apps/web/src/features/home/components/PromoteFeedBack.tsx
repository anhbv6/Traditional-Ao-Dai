'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';

const REVIEW_KEYS = ['1', '2', '3', '4', '5', '6'] as const;

/** Thời gian dừng ở mỗi đánh giá — đủ lâu để đọc trọn một trích dẫn */
const AUTOPLAY_MS = 7000;

const AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=150&auto=format&fit=crop',
];

/**
 * Một lời chứng thực lớn mỗi lần, tự trượt sang đánh giá kế tiếp sau mỗi 7 giây.
 * Nhịp tự chạy được điều khiển bằng chính thanh tiến trình CSS trên chấm đang chọn (onAnimationEnd),
 * nên tạm dừng chỉ cần `animation-play-state: paused`: khi rê chuột / focus vào thẻ, khi khối ra khỏi màn hình,
 * Khi người dùng bật giảm chuyển động: vẫn tự chuyển nhưng chỉ mờ dần, không trượt ngang.
 */
export function PromoteFeedBack() {
  const t = useTranslations('HomePage.promoteFeedback');
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const isInView = useInView(cardRef, { amount: 0.5 });
  const isPlaying = isInView && !isHovering;

  const total = REVIEW_KEYS.length;
  const key = REVIEW_KEYS[current];
  const goTo = (index: number) => setCurrent((index + total) % total);

  return (
    <section className="bg-[var(--bg-secondary)] py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20 lg:px-10 xl:px-16">
        <div>
          <SectionHeading index="05" align="left" eyebrow={t('eyebrow')} title={t('title')} description={t('description')} className="mb-8 sm:mb-8" />
          <div className="flex items-center gap-3 text-sm text-[var(--text-main)]">
            <span className="flex gap-0.5 text-[#C9A227]">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={15} fill="currentColor" stroke="none" />
              ))}
            </span>
            {t('rating')}
          </div>
          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              aria-label={t('prev')}
              className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-[var(--primary-color)]/30 text-[var(--primary-color)] transition-colors hover:bg-[var(--primary-color)] hover:text-white"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label={t('next')}
              className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-[var(--primary-color)]/30 text-[var(--primary-color)] transition-colors hover:bg-[var(--primary-color)] hover:text-white"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
            <span className="ml-3 font-[family-name:var(--font-playfair)] text-sm text-[var(--text-light)]">
              <span className="text-lg font-semibold text-[var(--primary-color)]">0{current + 1}</span> / 0{total}
            </span>
          </div>
        </div>

        <figure
          ref={cardRef}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onFocus={() => setIsHovering(true)}
          onBlur={() => setIsHovering(false)}
          className="relative bg-white px-7 py-10 shadow-[0_30px_60px_-35px_rgba(128,0,32,0.35)] sm:px-14 sm:py-14">
          <Quote aria-hidden="true" size={56} strokeWidth={1} className="absolute -top-7 left-7 fill-[var(--bg-secondary)] text-[var(--accent-color)] sm:left-14" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={key}
              initial={{ opacity: 0, x: reduceMotion ? 0 : 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduceMotion ? 0 : -48 }}
              transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <blockquote className="min-h-[9rem] font-[family-name:var(--font-playfair)] text-xl italic leading-relaxed text-[var(--text-main)] sm:text-2xl">
                &ldquo;{t(`reviews.${key}.content`)}&rdquo;
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4 border-t border-[var(--border)] pt-6">
                <span className="relative size-12 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                  <Image src={AVATARS[current]} alt={t(`reviews.${key}.name`)} fill sizes="48px" className="object-cover" />
                </span>
                <span>
                  <span className="block font-[family-name:var(--font-playfair)] font-semibold text-[var(--primary-color)]">
                    {t(`reviews.${key}.name`)}
                  </span>
                  <span className="block text-xs text-[var(--text-light)]">{t(`reviews.${key}.role`)}</span>
                </span>
              </figcaption>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex gap-2">
            {REVIEW_KEYS.map((item, i) => (
              <button
                key={item}
                type="button"
                onClick={() => goTo(i)}
                aria-label={t('goTo', { index: i + 1 })}
                aria-current={i === current}
                className={cn(
                  'relative h-1 cursor-pointer overflow-hidden rounded-full transition-all duration-500',
                  i === current ? 'w-10 bg-[var(--border)]' : 'w-3 bg-[var(--border)] hover:bg-[var(--accent-color)]',
                )}
              >
                {i === current ? (
                  <span
                    key={current}
                    aria-hidden="true"
                    onAnimationEnd={() => goTo(current + 1)}
                    className="absolute inset-0 origin-left rounded-full bg-[var(--primary-color)]"
                    style={{
                      animation: `progress-fill ${AUTOPLAY_MS}ms linear forwards`,
                      animationPlayState: isPlaying ? 'running' : 'paused',
                    }}
                  />
                ) : null}
              </button>
            ))}
          </div>
        </figure>
      </div>
    </section>
  );
}
export default PromoteFeedBack;
