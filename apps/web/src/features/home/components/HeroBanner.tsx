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

      <div className={containerClassName({ className: 'relative grid items-center gap-10 pb-12 pt-6 sm:gap-12 sm:pb-16 sm:pt-10 lg:min-h-[calc(100svh-80px)] lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:py-14' })}>
        {/* Tablet (1 cột, ảnh nằm dưới): căn giữa khối chữ cho cân với ảnh; desktop căn trái cạnh ảnh */}
        <div className="relative z-10 flex max-w-2xl flex-col animate-fade-in-up sm:mx-auto sm:items-center sm:text-center lg:mx-0 lg:items-start lg:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-[var(--primary-ink)] sm:text-[11px] sm:tracking-[3.5px]">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-[2.125rem] font-semibold leading-[1.1] text-[var(--primary-ink)] sm:mt-5 sm:text-[2.625rem] md:text-[2.875rem] lg:text-[4rem] lg:leading-[1.05] xl:text-[4.5rem] 2xl:text-[5rem]">
            {title}
          </h1>
          <SectionOrnament className="mt-5 sm:mt-6 lg:mt-7" />
          <p className="mt-5 max-w-[540px] text-[15px] leading-7 text-[var(--text-main)]/85 sm:mt-6 sm:text-base sm:leading-7 lg:mt-7 lg:text-lg lg:leading-8">
            {subtitle}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-center lg:mt-9 lg:justify-start">
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

          <dl className="mt-8 grid w-full max-w-lg grid-cols-3 divide-x divide-[var(--border)] border-t border-[var(--border)] pt-5 sm:mt-10 sm:pt-6 lg:mt-12">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex flex-col-reverse justify-end px-3 first:pl-0 sm:px-4 sm:first:pl-4 lg:first:pl-0">
                <dt className="mt-1 text-[11px] leading-4 text-[var(--text-light)] sm:text-xs sm:leading-5">{metric.label}</dt>
                <dd className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--primary-ink)] sm:text-[1.75rem]">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Cột phải: chỗ đặt ảnh / minh hoạ — truyền qua prop `media`.
            Chưa có media: chỉ giữ khoảng ở desktop, mobile ẩn để không chừa khoảng trắng lớn dưới phần chữ. */}
        <div
          className={`relative z-10 mx-auto aspect-[4/5] w-[calc(100%-0.75rem)] max-w-[360px] sm:aspect-[3/4] sm:w-full sm:max-w-[460px] lg:mr-0 xl:max-w-[500px] ${media ? '' : 'hidden lg:block'}`}
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
