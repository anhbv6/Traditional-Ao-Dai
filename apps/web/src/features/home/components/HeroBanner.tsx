import React, { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { type HeroMetric } from '../types/home.types';
import { SectionOrnament } from '@/components/shared/SectionOrnament';
import { ActionLink } from '@/components/shared/ActionLink';
import { FallingPetals } from '@/components/effects/FallingPetals';
import { containerClassName } from '@/components/layout/Container';

interface HeroBannerProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
  /** Nội dung cột phải (ảnh / video / minh hoạ…). Bỏ trống thì cột phải chỉ giữ chỗ */
  media?: ReactNode;
  scrollLabel: string;
  metrics: HeroMetric[];
}

/**
 * Hero dạng "trang tạp chí": chữ bên trái, cột phải dành cho ảnh / minh hoạ (truyền qua `media`).
 * Nền có cánh hoa rơi theo gió (FallingPetals); 2 CTA tách rõ mua sẵn / may đo.
 */
export function HeroBanner({
  eyebrow,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  media,
  scrollLabel,
  metrics,
}: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden bg-[var(--bg-main)]">
      <FallingPetals />

      <div className={containerClassName({ className: 'relative grid items-center gap-12 pb-16 pt-10 lg:min-h-[calc(100svh-80px)] lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:py-14' })}>
        <div className="relative z-10 flex max-w-2xl flex-col animate-fade-in-up">
          <p className="text-[11px] font-semibold uppercase tracking-[3.5px] text-[var(--primary-ink)]">
            {eyebrow}
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-playfair)] text-[2.75rem] font-semibold leading-[1.05] text-[var(--primary-ink)] sm:text-[3.25rem] lg:text-[4rem] xl:text-[4.5rem] 2xl:text-[5rem]">
            {title}
          </h1>
          <SectionOrnament className="mt-7" />
          <p className="mt-7 max-w-[540px] text-base leading-8 text-[var(--text-main)]/85 sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* CTA chính: xem bộ sưu tập — CTA phụ: liên hệ đặt may (viền mảnh) */}
            <ActionLink
              href="/products"
              variant="confirm"
              size="lg"
              icon={<ArrowRight strokeWidth={1.6} />}
              iconPosition="end"
            >
              {primaryAction}
            </ActionLink>
            <ActionLink href="/contact" variant="dialog" size="lg">
              {secondaryAction}
            </ActionLink>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-[var(--border)] border-t border-[var(--border)] pt-6">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex flex-col-reverse justify-end px-4 first:pl-0">
                <dt className="mt-1 text-xs leading-5 text-[var(--text-light)]">{metric.label}</dt>
                <dd className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--primary-ink)] sm:text-[1.75rem]">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Cột phải: chỗ đặt ảnh / minh hoạ — truyền qua prop `media`.
            Chưa có media: chỉ giữ khoảng ở desktop, mobile ẩn để không chừa khoảng trắng lớn dưới phần chữ. */}
        <div
          className={`relative z-10 mx-auto aspect-[3/4] w-full max-w-[460px] lg:mr-0 xl:max-w-[500px] ${media ? '' : 'hidden lg:block'}`}
        >
          {media}
        </div>
      </div>

      {/* Cánh hoa tầng gần bay TRƯỚC nội dung (kể cả ảnh slider) */}
      <FallingPetals depth="front" className="z-20" />

      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[3px] text-[var(--text-light)] lg:flex">
        {scrollLabel}
        {/* <span aria-hidden="true" className="h-10 w-px animate-pulse bg-[var(--primary-color)]/40" /> */}
      </div>
    </section>
  );
}
