'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ActionLink } from '@/components/shared/ActionLink';
import { ON_PRIMARY_COLORS } from '@/components/shared/ActionButton';
import { cn } from '@/lib/utils';
import { EVENT_SLIDE_SECONDS, productEvents, type ProductEvent } from '../data/productEvents';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Chữ vào theo hướng chuyển slide, từng dòng trễ nhau một nhịp */
const textVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 48 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE, staggerChildren: 0.07 } },
  exit: (direction: number) => ({ opacity: 0, x: direction * -32, transition: { duration: 0.4, ease: EASE } }),
};
const lineVariants: Variants = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
  exit: { opacity: 0 },
};

/**
 * Banner sự kiện đầu trang Cửa hàng — chiều cao CỐ ĐỊNH theo breakpoint, không phụ thuộc ảnh hay độ dài chữ:
 * - Ảnh là lớp nền tuyệt đối (mobile: nửa trên; desktop: ~58% bên phải), mép ảnh hòa vào màu sự kiện.
 * - Ít chữ, rõ thông tin: nhãn → tiêu đề (tối đa 2 dòng) → mức giảm + số ngày còn lại → CTA.
 * - Tự chuyển slide khi thanh tiến trình chạy hết (CSS animation -> `onAnimationEnd`), dừng khi rê chuột / focus.
 * - Vuốt ngang để chuyển trên màn cảm ứng; nút trước / sau và chấm số cho bàn phím.
 * - Giảm chuyển động: bỏ hiệu ứng trượt / phóng ảnh (đổi slide tức thì), vẫn tự chuyển và vẫn dừng khi rê chuột.
 */
export function ProductEventBanner() {
  const t = useTranslations('ProductsPage.events');
  const reduceMotion = useReducedMotion();
  const [[index, direction], setSlide] = useState<[number, number]>([0, 1]);
  const event = productEvents[index];
  const total = productEvents.length;

  const step = (delta: number) => setSlide(([current]) => [(current + delta + total) % total, delta]);
  const goTo = (target: number) => setSlide(([current]) => [target, target >= current ? 1 : -1]);

  return (
    <motion.section
      aria-roledescription="carousel"
      aria-label={t('label')}
      className="group/banner relative h-[600px] touch-pan-y overflow-hidden text-white transition-colors duration-1000 ease-out lg:h-[500px]"
      style={{ backgroundColor: event.panelColor }}
      onPanEnd={(_, info) => {
        if (info.offset.x < -60) step(1);
        else if (info.offset.x > 60) step(-1);
      }}
    >
      {/* Ảnh nền: mờ chéo giữa các slide + phóng chậm (Ken Burns) */}
      <div className="absolute inset-x-0 top-0 h-[60%] lg:inset-y-0 lg:left-auto lg:h-full lg:w-[58%]">
        <AnimatePresence initial={false}>
          <motion.div
            key={event.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { opacity: { duration: 1, ease: 'easeOut' }, scale: { duration: EVENT_SLIDE_SECONDS + 1, ease: 'easeOut' } }
            }
          >
            <Image
              src={event.image}
              alt={t(`items.${event.id}.imageAlt`)}
              fill
              priority={index === 0}
              draggable={false}
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="pointer-events-none select-none object-cover"
              style={{ objectPosition: event.imagePosition }}
            />
          </motion.div>
        </AnimatePresence>
        {/* Hòa mép ảnh vào khối màu: mobile hòa xuống dưới, desktop hòa sang trái */}
        {/* Gradient dùng currentColor để đổi màu mượt cùng lúc với nền section (gradient thường không chuyển tiếp được) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,currentColor_6%,transparent_50%)] transition-colors duration-1000 ease-out lg:hidden"
          style={{ color: event.panelColor }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,currentColor_0%,color-mix(in_srgb,currentColor_80%,transparent)_15%,transparent_55%)] transition-colors duration-1000 ease-out lg:block"
          style={{ color: event.panelColor }}
        />
      </div>

      {/* Khối nội dung: chữ + CTA đi cùng nhau, thanh số ở đáy — tất cả nằm trong luồng nên không đè lên nhau */}
      <div className="relative mx-auto flex h-full w-full max-w-[1440px] flex-col px-5 pb-6 sm:px-8 lg:px-10 lg:pb-8 xl:px-16">
        <div className="flex flex-1 flex-col justify-end lg:justify-center lg:pt-6">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={event.id}
              custom={direction}
              variants={reduceMotion ? undefined : textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              aria-live="polite"
              // Desktop: không vượt quá phần nền màu (ảnh chiếm 58% bên phải)
              className="max-w-[520px] lg:max-w-[min(460px,36vw)]"
            >
              <motion.p
                variants={lineVariants}
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[3px] text-[var(--accent-color)]"
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--accent-color)]" />
                {t(`items.${event.id}.tag`)}
              </motion.p>
              <motion.h2
                variants={lineVariants}
                className="mt-3 line-clamp-2 text-balance font-[family-name:var(--font-playfair)] text-[1.75rem] font-semibold leading-[1.15] text-white sm:mt-4 sm:text-[2.375rem] lg:text-[2.25rem] xl:text-[2.5rem] 2xl:text-[2.75rem]"
              >
                {t(`items.${event.id}.title`)}
              </motion.h2>
              {/* Ưu đãi: mức giảm nổi bật + số ngày còn lại */}
              <motion.div variants={lineVariants} className="mt-4 flex items-baseline gap-4 sm:mt-5">
                <p className="font-[family-name:var(--font-playfair)] text-[2.5rem] font-semibold italic leading-none text-[var(--accent-color)] sm:text-[3.25rem]">
                  {t(`items.${event.id}.discount`)}
                </p>
                <EventCountdown endsAt={event.endsAt} />
              </motion.div>
              {/* CTA ngay dưới ưu đãi, đổi cùng slide */}
              <motion.div variants={lineVariants} className="mt-6 sm:mt-8">
                {/* Nền banner là tông tối → bộ màu ON_PRIMARY_COLORS (đồng bộ khối May đo trang chủ) */}
                <ActionLink
                  href={`/products?category=${event.collection}#product-list`}
                  scroll={false}
                  variant="custom"
                  size="md"
                  colors={ON_PRIMARY_COLORS.solid}
                  icon={<ArrowRight strokeWidth={1.6} />}
                  iconPosition="end"
                  className="whitespace-nowrap"
                >
                  {t(`items.${event.id}.cta`)}
                </ActionLink>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav số 01 / 02 / 03 — hàng riêng ở đáy cột chữ (luôn trên nền màu, dễ đọc) */}
        <ol className="mt-6 flex gap-3 lg:mt-0">
          {productEvents.map((item, i) => {
            const isActive = i === index;
            return (
              <li key={item.id} className="w-14 sm:w-20">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={t('goTo', { title: t(`items.${item.id}.title`) })}
                  aria-current={isActive}
                  className="group/dot w-full cursor-pointer pb-2 pt-1 text-left"
                >
                  <span className={cn('text-[11px] tabular-nums transition-colors', isActive ? 'text-white' : 'text-white/45 group-hover/dot:text-white/80')}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="mt-2 block h-px overflow-hidden bg-white/20">
                    {isActive ? (
                      <span
                        key={`${item.id}-${index}`}
                        className="block h-full origin-left scale-x-0 animate-[progress-fill_var(--slide-duration)_linear_forwards] bg-white group-hover/banner:[animation-play-state:paused] group-focus-within/banner:[animation-play-state:paused]"
                        style={{ ['--slide-duration' as string]: `${EVENT_SLIDE_SECONDS}s` }}
                        onAnimationEnd={() => step(1)}
                      />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Nút trước / sau — góc dưới phải */}
        {/* <div className="mt-6 flex items-end justify-end gap-2 lg:mt-0">
          {[
            { delta: -1, label: t('prev'), Icon: ArrowLeft },
            { delta: 1, label: t('next'), Icon: ArrowRight },
          ].map(({ delta, label, Icon }) => (
            <button
              key={delta}
              type="button"
              onClick={() => step(delta)}
              aria-label={label}
              className="grid size-10 cursor-pointer place-items-center border border-white/25 bg-black/10 text-white backdrop-blur-sm transition-colors duration-300 hover:border-white hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
            >
              <Icon size={16} strokeWidth={1.6} />
            </button>
          ))}
        </div> */}
      </div>
    </motion.section>

  );
}

/* ------------------------------------------------------------------ */
/* Số ngày còn lại tới lúc ưu đãi kết thúc                             */
/* ------------------------------------------------------------------ */

/** Đồng hồ dùng chung: mỗi phút báo một lần; server trả null để HTML server/client khớp nhau */
function subscribeClock(onTick: () => void) {
  const id = window.setInterval(onTick, 60_000);
  return () => window.clearInterval(id);
}
const getNowMinutes = () => Math.floor(Date.now() / 60_000);
const getServerNow = () => null;

function EventCountdown({ endsAt }: { endsAt: ProductEvent['endsAt'] }) {
  const t = useTranslations('ProductsPage.events');
  const now = useSyncExternalStore(subscribeClock, getNowMinutes, getServerNow);
  if (now === null) return null;

  const remainingMs = new Date(endsAt).getTime() - now * 60_000;
  const days = Math.floor(remainingMs / 86_400_000);
  const label = remainingMs <= 0 ? t('ended') : days >= 1 ? t('daysLeft', { days }) : t('endsToday');

  return <p className="whitespace-nowrap text-xs uppercase tracking-[2px] text-white/70">{label}</p>;
}
