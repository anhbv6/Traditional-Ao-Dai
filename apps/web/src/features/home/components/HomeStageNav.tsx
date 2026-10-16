'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, MotionConfig, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { useTranslations } from 'next-intl';
import { OrnateFrame } from '@/components/shared/OrnateFrame';
import { cn } from '@/lib/utils';
import { HOME_STAGES, homeStageElementId } from '../constants/homeStages';

/** Khoảng cách giữa hai mốc (px) */
const STEP_GAP = 34;
const TRACK_HEIGHT = STEP_GAP * (HOME_STAGES.length - 1);
/** "Mắt nhìn" ở 40% chiều cao màn hình: khối nào chạm mốc này thì được coi là đang xem */
const ANCHOR_RATIO = 0.4;
/** Nhãn của mốc vừa chuyển tới hiện thoáng trong khoảng này rồi tự ẩn (rê chuột vào thanh thì hiện lại) */
const LABEL_FLASH_MS = 1600;

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Thanh tiến trình trang chủ dạng các GIAI ĐOẠN — cố định giữa mép phải (chỉ desktop).
 * - Mỗi khối trang chủ (bọc bằng HomeStage) là một mốc thoi; đường nối tô vàng dần theo vị trí cuộn, có lò xo nên trượt mềm.
 * - Mốc đã qua: thoi vàng đặc. Mốc đang xem: thoi đỏ đô + vòng thoi vàng trượt theo và toả sóng nhẹ.
 * - Tương tác: rê chuột / focus vào mốc nào → chỉ hiện tên khối đó (khung OrnateFrame); bấm mốc hoặc bấm nhãn → cuộn mượt tới khối.
 * - Mốc đầu là banner (không đánh số), các mốc sau đánh số 01, 02… khớp số trên tiêu đề từng khối.
 * - Đổi khối: tên khối mới hiện thoáng rồi ẩn, không che nội dung lâu.
 * - Tự giảm hiệu ứng khi người dùng bật "giảm chuyển động".
 */
export function HomeStageNav() {
  const t = useTranslations('HomePage.stages');
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [flashLabel, setFlashLabel] = useState(false);
  const flashTimer = useRef<number | undefined>(undefined);
  const activeRef = useRef(0);

  /* Tỉ lệ đã đi trên toàn thanh (0 → 1), làm mượt bằng lò xo rồi đổi ra chiều cao phần tô */
  const fill = useMotionValue(0);
  const smoothFill = useSpring(fill, { stiffness: 120, damping: 24, restDelta: 0.0005 });
  const fillHeight = useTransform(smoothFill, (value) => value * TRACK_HEIGHT);

  useEffect(() => {
    let frame = 0;

    /* Đo vị trí các khối mỗi khung hình có cuộn (gộp qua requestAnimationFrame, không đo thừa) */
    const measure = () => {
      frame = 0;
      const anchor = window.innerHeight * ANCHOR_RATIO;
      const tops = HOME_STAGES.map(
        (id) => document.getElementById(homeStageElementId(id))?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
      );

      let index = 0;
      tops.forEach((top, i) => {
        if (top <= anchor) index = i;
      });

      /* Khối cuối thường ngắn, không chạm được mốc nhìn → cuộn chạm đáy trang thì coi như tới khối cuối */
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let position = index;
      if (atBottom) {
        index = HOME_STAGES.length - 1;
        position = index;
      } else if (index < HOME_STAGES.length - 1) {
        const span = tops[index + 1] - tops[index];
        position = index + Math.min(Math.max((anchor - tops[index]) / span, 0), 1);
      }

      fill.set(position / (HOME_STAGES.length - 1));

      if (index !== activeRef.current) {
        activeRef.current = index;
        setActive(index);
        setFlashLabel(true);
        window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlashLabel(false), LABEL_FLASH_MS);
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(flashTimer.current);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [fill]);

  const goTo = (index: number) => {
    document
      .getElementById(homeStageElementId(HOME_STAGES[index]))
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.nav
        aria-label={t('label')}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block xl:right-8"
      >
        <ol className="relative w-4" style={{ height: TRACK_HEIGHT }}>
          {/* Đường nối nền + phần đã đi (vàng kim — đọc rõ trên cả nền kem lẫn nền đỏ đô) */}
          <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--accent-color)]/35" />
          <motion.span
            aria-hidden="true"
            className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-[var(--accent-color)] shadow-[0_0_6px_var(--accent-color)]"
            style={{ height: fillHeight }}
          />

          {/* Vòng thoi đánh dấu mốc đang xem — trượt giữa các mốc bằng lò xo.
              Lớp ngoài chỉ dịch dọc, lớp trong mới xoay 45° (gộp lại thì phép dịch bị quay chéo). */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 left-0 size-4"
            animate={{ y: active * STEP_GAP }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <span className="absolute inset-0 rotate-45 border border-[var(--accent-color)]" />
            {/* Sóng toả nhẹ quanh mốc đang xem */}
            <motion.span
              className="absolute inset-0 rotate-45 border border-[var(--accent-color)]"
              animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
              transition={{ duration: 2.2, ease: 'easeOut', repeat: Infinity }}
            />
          </motion.span>

          {HOME_STAGES.map((id, index) => {
            const isActive = index === active;
            const isPassed = index < active;
            const showLabel = isActive && flashLabel;

            return (
              <li key={id} className="absolute -top-2 right-0" style={{ transform: `translateY(${index * STEP_GAP}px)` }}>
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={t(id)}
                  aria-current={isActive ? 'step' : undefined}
                  className="group/stage relative flex size-4 cursor-pointer items-center justify-center outline-none"
                >
                  {/* Mốc thoi */}
                  <span
                    className={cn(
                      'block size-[7px] rotate-45 border transition-all duration-500 ease-out group-hover/stage:scale-125 group-focus-visible/stage:scale-125',
                      isActive
                        ? 'scale-125 border-[var(--accent-color)] bg-[var(--primary-color)]'
                        : isPassed
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]'
                          : 'border-[var(--accent-color)]/70 bg-[var(--bg-card)]',
                    )}
                  />

                  {/* Nhãn: số thứ tự + tên khối, bọc khung viền gấm dùng chung (OrnateFrame).
                      Chỉ hiện cho mốc đang rê chuột / focus, hoặc thoáng qua lúc vừa tới khối.
                      Nằm TRONG nút → rê từ mốc sang nhãn vẫn giữ hover, bấm nhãn = bấm mốc.
                      pr-3 làm "cầu nối" lấp khoảng hở giữa mốc và nhãn để không mất hover khi rê ngang. */}
                  <span
                    className={cn(
                      'absolute right-full top-1/2 -translate-y-1/2 pr-3',
                      'transition-[opacity,translate] duration-300 ease-out',
                      'group-hover/stage:pointer-events-auto group-hover/stage:translate-x-0 group-hover/stage:opacity-100',
                      'group-focus-visible/stage:translate-x-0 group-focus-visible/stage:opacity-100',
                      showLabel ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none translate-x-2 opacity-0',
                    )}
                  >
                    <OrnateFrame
                      size="sm"
                      shimmer="hover"
                      hoverLift
                      contentClassName="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 leading-none"
                    >
                      {/* Banner (mốc 0) không đánh số */}
                      {index > 0 ? (
                        <span className="font-[family-name:var(--font-playfair)] text-[11px] font-semibold text-[var(--accent-color)]">
                          {pad(index)}
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-[2px] transition-colors group-hover/frame:text-[var(--primary-ink)]',
                          isActive ? 'text-[var(--primary-ink)]' : 'text-[var(--text-light)]',
                        )}
                      >
                        {t(id)}
                      </span>
                    </OrnateFrame>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </motion.nav>
    </MotionConfig>
  );
}
