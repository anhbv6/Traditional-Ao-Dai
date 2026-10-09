'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
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
 * Banner sự kiện đầu trang Cửa hàng: khối chữ màu theo sự kiện + ảnh dọc bên phải (trên mobile: ảnh ở trên).
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
    <section
      aria-roledescription="carousel"
      aria-label={t('label')}
      className="group/banner relative overflow-hidden text-white transition-colors duration-1000 ease-out"
      style={{ backgroundColor: event.panelColor }}
    >
      <div className="mx-auto grid w-full max-w-[1440px] lg:min-h-[500px] lg:grid-cols-[1fr_minmax(0,600px)]">
        {/* Ảnh: mờ chéo giữa các slide + phóng chậm (Ken Burns); kéo ngang để chuyển */}
        <motion.div
          className="relative h-[260px] cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing sm:h-[400px] lg:order-2 lg:h-auto"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) step(1);
            else if (info.offset.x > 60) step(-1);
          }}
        >
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
                sizes="(max-width: 1024px) 100vw, 600px"
                className="pointer-events-none object-cover"
                style={{ objectPosition: event.imagePosition }}
              />
            </motion.div>
          </AnimatePresence>
          {/* Nối mép ảnh vào khối màu cho liền mạch */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-[background] duration-1000"
            style={{ background: `linear-gradient(to top, ${event.panelColor} 0%, transparent 35%)` }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden transition-[background] duration-1000 lg:block"
            style={{ background: `linear-gradient(to right, ${event.panelColor} 0%, transparent 30%)` }}
          />
        </motion.div>

        <div className="relative flex flex-col justify-between gap-10 px-5 pb-8 pt-2 sm:px-8 lg:order-1 lg:px-10 lg:py-14 xl:px-16">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={event.id}
              custom={direction}
              variants={reduceMotion ? undefined : textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              aria-live="polite"
            >
              <motion.p variants={lineVariants} className="text-[11px] font-semibold uppercase tracking-[3.5px] text-[var(--accent-color)]">
                {t(`items.${event.id}.tag`)}
              </motion.p>
              <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
                <motion.h2
                  variants={lineVariants}
                  className="max-w-lg font-[family-name:var(--font-playfair)] text-[32px] font-semibold leading-[1.1] text-white sm:text-[44px]"
                >
                  {t(`items.${event.id}.title`)}
                </motion.h2>
                <motion.p
                  variants={lineVariants}
                  className="font-[family-name:var(--font-playfair)] text-[44px] font-semibold italic leading-none text-[var(--accent-color)] sm:text-[60px]"
                >
                  {t(`items.${event.id}.discount`)}
                </motion.p>
              </div>
              <motion.p variants={lineVariants} className="mt-5 max-w-md text-[15px] leading-7 text-white/75">
                {t(`items.${event.id}.description`)}
              </motion.p>

              <motion.div variants={lineVariants} className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-6">
                <Link
                  href={`/products?category=${event.collection}#product-list`}
                  scroll={false}
                  className="group/cta inline-flex min-h-12 items-center gap-3 bg-white px-7 text-xs font-semibold uppercase tracking-[2px] text-[var(--text-main)] transition-colors duration-300 hover:bg-[var(--accent-color)] hover:text-white"
                >
                  {t(`items.${event.id}.cta`)}
                  <ArrowRight size={15} strokeWidth={1.6} className="transition-transform duration-300 group-hover/cta:translate-x-1" />
                </Link>
                <EventCountdown endsAt={event.endsAt} />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Điều hướng: số thứ tự + thanh tiến trình tự chạy, nút trước / sau */}
          <div className="flex items-center justify-between gap-6">
            <ol className="flex flex-1 gap-3 sm:max-w-sm">
              {productEvents.map((item, i) => {
                const isActive = i === index;
                return (
                  <li key={item.id} className="flex-1">
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
            <div className="flex gap-2">
              {[
                { delta: -1, label: t('prev'), Icon: ArrowLeft },
                { delta: 1, label: t('next'), Icon: ArrowRight },
              ].map(({ delta, label, Icon }) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => step(delta)}
                  aria-label={label}
                  className="grid size-10 cursor-pointer place-items-center border border-white/25 text-white transition-colors duration-300 hover:border-white hover:bg-white hover:text-[var(--text-main)]"
                >
                  <Icon size={16} strokeWidth={1.6} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Đếm ngược tới lúc ưu đãi kết thúc                                   */
/* ------------------------------------------------------------------ */

/** Đồng hồ dùng chung: mỗi giây báo một lần; server trả null để HTML server/client khớp nhau */
function subscribeClock(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
const getNowSeconds = () => Math.floor(Date.now() / 1000);
const getServerNow = () => null;

function EventCountdown({ endsAt }: { endsAt: ProductEvent['endsAt'] }) {
  const t = useTranslations('ProductsPage.events');
  const now = useSyncExternalStore(subscribeClock, getNowSeconds, getServerNow);
  const remaining = now === null ? null : Math.max(0, Math.floor(new Date(endsAt).getTime() / 1000) - now);

  if (remaining === 0) {
    return <p className="text-xs uppercase tracking-[2px] text-white/60">{t('ended')}</p>;
  }

  const units = [
    { key: 'days', value: remaining === null ? null : Math.floor(remaining / 86400) },
    { key: 'hours', value: remaining === null ? null : Math.floor((remaining % 86400) / 3600) },
    { key: 'minutes', value: remaining === null ? null : Math.floor((remaining % 3600) / 60) },
    { key: 'seconds', value: remaining === null ? null : remaining % 60 },
  ] as const;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[2.5px] text-white/55">{t('endsIn')}</p>
      <dl className="mt-2 flex items-start divide-x divide-white/20">
        {units.map((unit) => (
          <div key={unit.key} className="flex flex-col-reverse px-3 first:pl-0 last:pr-0">
            <dt className="mt-0.5 text-[10px] text-white/50">{t(`units.${unit.key}`)}</dt>
            <dd className="font-[family-name:var(--font-playfair)] text-xl tabular-nums text-white sm:text-2xl">
              {unit.value === null ? '--' : String(unit.value).padStart(2, '0')}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
