'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { RatingBadge } from './RatingBadge';
import { SliderNav } from '@/components/shared/SliderNav';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import { containerClassName } from '@/components/layout/Container';

/** Mỗi đánh giá kèm ảnh khách diện áo — chữ ở messages HomePage.promoteFeedback.reviews.<key> */
const REVIEWS = [
  { key: '1', photo: '/images/ex5.jpg' },
  { key: '2', photo: '/images/ex6.jpg' },
  { key: '3', photo: '/images/ex7.jpg' },
  { key: '4', photo: '/images/ex8.jpg' },
  { key: '5', photo: '/images/ex9.jpg' },
  { key: '6', photo: '/images/ex10.jpg' },
] as const;

/** Điểm đánh giá trung bình (thang 5) */
const RATING_SCORE = 4.9;

/** Thời gian dừng ở mỗi đánh giá — đủ lâu để đọc trọn một trích dẫn */
const AUTOPLAY_MS = 7000;

const EASE = [0.25, 1, 0.5, 1] as const;

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Cảm nhận khách hàng — bố cục tạp chí hai cột:
 * - Trái: ảnh khách diện áo (đổi mờ dần theo đánh giá), khung viền mảnh lệch phía sau + thẻ điểm đánh giá đè mép.
 * - Phải: tiêu đề, trích dẫn lớn, tên khách; MỘT hàng điều khiển duy nhất: thanh tiến trình, ảnh đại diện để chọn, số thứ tự, nút Trước / Sau.
 * Tự chuyển sau mỗi 7 giây — nhịp do thanh tiến trình CSS điều khiển (onAnimationEnd), nên tạm dừng chỉ cần
 * `animation-play-state: paused` khi rê chuột / focus vào khối hoặc khối ra khỏi màn hình.
 * Bật "giảm chuyển động": chỉ mờ dần, không trượt / phóng.
 */
export function PromoteFeedBack() {
  const t = useTranslations('HomePage.promoteFeedback');
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.4 });
  const isPlaying = isInView && !isHovering;

  const total = REVIEWS.length;
  const review = REVIEWS[current];
  const goTo = (index: number) => setCurrent((index + total) % total);

  return (
    <section className="overflow-hidden bg-[var(--bg-secondary)] py-(--section-y)">
      <div
        ref={sectionRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onFocus={() => setIsHovering(true)}
        onBlur={() => setIsHovering(false)}
        className={containerClassName({ className: 'grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-20 xl:gap-28' })}
      >
        {/* ---------- Cột trái: ảnh khách + điểm đánh giá ---------- */}
        <div className="relative mx-auto w-full max-w-[420px] pb-6 pl-6 lg:mx-0 lg:max-w-none">
          {/* Khung viền mảnh lệch về góc dưới trái — đồng bộ ngôn ngữ khung tranh của banner */}
          <div aria-hidden="true" className="absolute inset-0 left-0 top-6 right-6 border border-[var(--accent-color)]/60" />

          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-card)] shadow-[0_40px_80px_-40px_rgba(128,0,32,0.45)]">
            <AnimatePresence initial={false}>
              <motion.div
                key={review.key}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: EASE }}
              >
                <Image
                  src={review.photo}
                  alt={t(`reviews.${review.key}.name`)}
                  fill
                  sizes="(max-width: 1024px) 90vw, 520px"
                  className="object-cover object-[50%_20%]"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Thẻ điểm đánh giá (component dùng chung) */}
          <RatingBadge
            score={RATING_SCORE}
            label={t('ratingLabel')}
            caption={t('ratingCount')}
            className="absolute -right-2 bottom-12 z-10 sm:-right-10"
          />
        </div>

        {/* ---------- Cột phải: trích dẫn + điều khiển ---------- */}
        <div>
          <SectionHeading index="05" align="left" eyebrow={t('eyebrow')} title={t('title')} description={t('description')} className="mb-10 sm:mb-12" />

          <figure aria-live="polite">
            {/* Dấu ngoặc kép trang trí */}
            <span aria-hidden="true" className="block h-10 font-[family-name:var(--font-playfair)] text-[5.5rem] leading-none text-[var(--accent-color)]/60">
              &ldquo;
            </span>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={review.key}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <blockquote className="min-h-[9.5rem] font-[family-name:var(--font-playfair)] text-xl italic leading-[1.65] text-[var(--text-main)] sm:min-h-[11rem] sm:text-[1.5625rem]">
                  {t(`reviews.${review.key}.content`)}
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-4">
                  <span aria-hidden="true" className="h-px w-10 bg-[var(--accent-color)]" />
                  <span>
                    <span className="block font-[family-name:var(--font-playfair)] text-lg font-semibold text-[var(--primary-ink)]">
                      {t(`reviews.${review.key}.name`)}
                    </span>
                    <span className="mt-0.5 block text-[11px] uppercase tracking-[2px] text-[var(--text-light)]">
                      {t(`reviews.${review.key}.role`)}
                    </span>
                  </span>
                </figcaption>
              </motion.div>
            </AnimatePresence>
          </figure>

          {/* Thanh tiến trình tự chuyển */}
          <div className="relative mt-10 h-px overflow-hidden bg-[var(--primary-color)]/15">
            <span
              key={current}
              aria-hidden="true"
              onAnimationEnd={() => goTo(current + 1)}
              className="absolute inset-0 origin-left bg-[var(--primary-color)]"
              style={{
                animation: `progress-fill ${AUTOPLAY_MS}ms linear forwards`,
                animationPlayState: isPlaying ? 'running' : 'paused',
              }}
            />
          </div>

          {/* Hàng điều khiển: ảnh đại diện (chọn nhanh) — số thứ tự — Trước / Sau */}
          <div className="mt-6 flex items-center justify-between gap-6">
            <div className="hidden items-center gap-3 sm:flex">
              {REVIEWS.map((item, i) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={t('goTo', { index: i + 1 })}
                  aria-current={i === current}
                  className={cn(
                    'relative block size-10 cursor-pointer overflow-hidden rounded-full ring-offset-2 ring-offset-[var(--bg-secondary)] transition-all duration-500 ease-out',
                    i === current
                      ? 'scale-110 ring-1 ring-[var(--accent-color)]'
                      : 'opacity-55 grayscale-[60%] hover:opacity-100 hover:grayscale-0',
                  )}
                >
                  <Image src={item.photo} alt="" fill sizes="40px" className="object-cover object-[50%_15%]" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-5">
              <span className="font-[family-name:var(--font-playfair)] text-sm text-[var(--text-light)]">
                <span className="text-lg font-semibold text-[var(--primary-ink)]">{pad(current + 1)}</span> / {pad(total)}
              </span>
              <SliderNav onPrev={() => goTo(current - 1)} onNext={() => goTo(current + 1)} prevLabel={t('prev')} nextLabel={t('next')} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default PromoteFeedBack;
