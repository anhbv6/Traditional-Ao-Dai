'use client';

import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useLenis } from 'lenis/react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';

const CRAFT_STEPS = [
  { key: '1', image: '/images/login2.jpg', imageClass: 'object-[50%_40%]' },
  // Phóng to vùng hoa văn thêu trên thân áo
  { key: '2', image: '/login_banner.jpg', imageClass: 'object-[55%_70%] scale-[1.6]' },
  { key: '3', image: '/images/login1.jpg', imageClass: 'object-[50%_45%]' },
] as const;

/** Khoảng trống tối thiểu phía trên khi cuộn tới một bước (chừa chỗ cho header dính) */
const HEADER_OFFSET = 112;

const stepElementId = (key: string) => `craft-step-${key}`;

/**
 * Kể chuyện theo cuộn (scrollytelling): ảnh bên trái đứng yên (sticky), chữ bên phải chạy qua từng công đoạn.
 * Mỗi lần cuộn tới bước mới ảnh đổi theo — tạo "phần thưởng thị giác" liên tục để khách đọc hết câu chuyện.
 * Thanh mục lục dưới ảnh, số thứ tự và tên mỗi bước đều bấm được để cuộn thẳng tới bước đó.
 */
export function CraftStory() {
  const t = useTranslations('HomePage.craftStory');
  const lenis = useLenis();
  const [activeStep, setActiveStep] = useState(0);

  const scrollToStep = useCallback(
    (index: number) => {
      const element = document.getElementById(stepElementId(CRAFT_STEPS[index].key));
      if (!element) return;
      setActiveStep(index);

      // Căn bước vào giữa màn hình, nhưng không để đè dưới header
      const offset = -Math.max(HEADER_OFFSET, (window.innerHeight - element.offsetHeight) / 2);
      if (lenis) {
        lenis.scrollTo(element, { offset, duration: 1.4, easing: (x) => 1 - Math.pow(1 - x, 3) });
      } else {
        window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' });
      }
    },
    [lenis],
  );

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 xl:px-16">
      <SectionHeading index="03" eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Cột ảnh dính — chỉ hiện ở desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-28 flex max-h-[calc(100svh-9rem)] flex-col">
            <div className="relative aspect-[4/5] min-h-0 w-full flex-1 overflow-hidden bg-[var(--bg-secondary)]">
              {CRAFT_STEPS.map((step, i) => (
                <Image
                  key={step.key}
                  src={step.image}
                  alt={t(`steps.${step.key}.title`)}
                  fill
                  sizes="45vw"
                  className={cn(
                    'object-cover transition-opacity duration-1000 ease-out',
                    step.imageClass,
                    activeStep === i ? 'opacity-100' : 'opacity-0',
                  )}
                />
              ))}
            </div>

            {/* Mục lục các công đoạn: góc vuông, vạch đỏ đô phía trên đánh dấu bước đang xem */}
            <nav aria-label={t('eyebrow')} className="grid grid-cols-3 border-x border-b border-[var(--border)] bg-white">
              {CRAFT_STEPS.map((step, i) => {
                const isActive = activeStep === i;
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => scrollToStep(i)}
                    aria-current={isActive ? 'step' : undefined}
                    className={cn(
                      'group relative flex cursor-pointer items-baseline gap-3 px-5 py-4 text-left transition-colors duration-500',
                      i > 0 && 'border-l border-[var(--border)]',
                      isActive ? 'bg-[var(--bg-main)]' : 'hover:bg-[var(--bg-main)]',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-0 -top-px h-0.5 origin-left bg-[var(--primary-color)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        isActive ? 'scale-x-100' : 'scale-x-0',
                      )}
                    />
                    <span
                      className={cn(
                        'font-[family-name:var(--font-playfair)] text-lg font-semibold transition-colors duration-500',
                        isActive ? 'text-[var(--primary-color)]' : 'text-[var(--text-light)]/60 group-hover:text-[var(--primary-color)]',
                      )}
                    >
                      0{i + 1}
                    </span>
                    <span
                      className={cn(
                        'truncate text-[11px] font-semibold uppercase tracking-[2px] transition-colors duration-500',
                        isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-light)] group-hover:text-[var(--text-main)]',
                      )}
                    >
                      {t(`steps.${step.key}.label`)}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <ol className="relative flex flex-col lg:py-[10vh]">
          {/* Đường tiến trình dọc */}
          <span aria-hidden="true" className="absolute bottom-0 left-[19px] top-0 w-px bg-[var(--border)] lg:left-[23px]" />

          {CRAFT_STEPS.map((step, i) => {
            const isActive = activeStep === i;
            return (
              <motion.li
                key={step.key}
                id={stepElementId(step.key)}
                onViewportEnter={() => setActiveStep(i)}
                viewport={{ amount: 0.6 }}
                className="relative flex gap-6 pb-14 last:pb-0 lg:min-h-[60vh] lg:items-center lg:pb-0"
              >
                <button
                  type="button"
                  onClick={() => scrollToStep(i)}
                  aria-label={t(`steps.${step.key}.title`)}
                  className={cn(
                    'relative z-10 flex size-10 shrink-0 cursor-pointer items-center justify-center border font-[family-name:var(--font-playfair)] text-sm transition-colors duration-500 lg:size-12',
                    isActive
                      ? 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white'
                      : 'border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-light)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]',
                  )}
                >
                  0{i + 1}
                </button>

                <div className={cn('transition-opacity duration-700', isActive ? 'opacity-100' : 'lg:opacity-40')}>
                  <div className="relative mb-6 aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)] lg:hidden">
                    <Image
                      src={step.image}
                      alt={t(`steps.${step.key}.title`)}
                      fill
                      sizes="90vw"
                      className={cn('object-cover', step.imageClass)}
                    />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--accent-color)]">
                    {t(`steps.${step.key}.label`)}
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--primary-color)] sm:text-[32px]">
                    <button
                      type="button"
                      onClick={() => scrollToStep(i)}
                      className="cursor-pointer text-left decoration-[var(--accent-color)] decoration-1 underline-offset-8 transition-colors hover:underline"
                    >
                      {t(`steps.${step.key}.title`)}
                    </button>
                  </h3>
                  <p className="mt-4 max-w-md text-[15px] leading-8 text-[var(--text-main)]/80">{t(`steps.${step.key}.content`)}</p>
                  {i === CRAFT_STEPS.length - 1 ? (
                    <Link
                      href="/about"
                      className="group mt-8 inline-flex items-center gap-3 border-b border-[var(--primary-color)]/40 pb-1 text-xs font-semibold uppercase tracking-[2px] text-[var(--primary-color)] hover:border-[var(--primary-color)]"
                    >
                      {t('cta')}
                      <ArrowRight size={15} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  ) : null}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
