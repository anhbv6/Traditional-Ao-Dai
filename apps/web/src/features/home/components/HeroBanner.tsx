import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { type HeroMetric } from '../types/home.types';
import { SectionOrnament } from '@/components/shared/SectionOrnament';

interface HeroBannerProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
  imageAlt: string;
  note: string;
  caption: string;
  scrollLabel: string;
  metrics: HeroMetric[];
}

/**
 * Hero dạng "trang tạp chí": chữ bên trái, ảnh khung vòm (gợi ô cửa nhà cổ) bên phải.
 * Ảnh thật của sản phẩm tạo cảm xúc ngay màn hình đầu; 2 CTA tách rõ mua sẵn / may đo.
 */
export function HeroBanner({
  eyebrow,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  imageAlt,
  note,
  caption,
  scrollLabel,
  metrics,
}: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden bg-[var(--bg-main)]">
      {/* Nền giấy dó: dải màu nhạt phía phải giúp ảnh nổi khối */}
      <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[38%] bg-[var(--bg-secondary)] lg:block" />

      <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:min-h-[calc(100svh-80px)] lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:px-10 lg:py-14 xl:px-16">
        <div className="relative z-10 flex max-w-2xl flex-col animate-fade-in-up">
          <p className="text-[11px] font-semibold uppercase tracking-[3.5px] text-[var(--primary-color)]">
            {eyebrow}
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-playfair)] text-[44px] font-semibold leading-[1.05] text-[var(--primary-color)] sm:text-[64px] xl:text-[80px]">
            {title}
          </h1>
          <SectionOrnament className="mt-7" />
          <p className="mt-7 max-w-[540px] text-base leading-8 text-[var(--text-main)]/85 sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/products"
              className="group inline-flex min-h-12 items-center justify-center gap-3 bg-[var(--primary-color)] px-7 text-xs font-semibold uppercase tracking-[2px] text-white transition-colors duration-300 hover:bg-[var(--text-main)]"
            >
              {primaryAction}
              <ArrowRight size={16} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center border border-[var(--primary-color)]/30 px-7 text-xs font-semibold uppercase tracking-[2px] text-[var(--primary-color)] transition-colors duration-300 hover:border-[var(--primary-color)] hover:bg-white"
            >
              {secondaryAction}
            </Link>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-[var(--border)] border-t border-[var(--border)] pt-6">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex flex-col-reverse justify-end px-4 first:pl-0">
                <dt className="mt-1 text-xs leading-5 text-[var(--text-light)]">{metric.label}</dt>
                <dd className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--primary-color)] sm:text-[28px]">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-[460px] lg:mr-0 xl:max-w-[500px]">
          {/* Viền vòm lệch phía sau — chi tiết trang trí cổ điển */}
          <div aria-hidden="true" className="absolute -right-4 -top-4 h-full w-full rounded-t-full border border-[var(--accent-color)]/70 sm:-right-6 sm:-top-6" />
          <div className="relative aspect-[3/4] overflow-hidden rounded-t-full bg-[var(--bg-secondary)] shadow-[0_40px_80px_-30px_rgba(128,0,32,0.35)]">
            <Image
              src="/login_banner.jpg"
              alt={imageAlt}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 1024px) 90vw, 500px"
              className="object-cover object-[50%_30%]"
            />
          </div>

          <p className="absolute -left-3 bottom-10 bg-white px-5 py-3 font-[family-name:var(--font-playfair)] text-sm italic text-[var(--primary-color)] shadow-sm sm:-left-10">
            {caption}
          </p>
          <p className="absolute -right-2 top-16 hidden max-w-[200px] border-l-2 border-[var(--accent-color)] bg-white/95 px-4 py-3 text-xs leading-5 text-[var(--text-light)] shadow-sm backdrop-blur sm:block xl:-right-12">
            {note}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[3px] text-[var(--text-light)] lg:flex">
        {scrollLabel}
        <span aria-hidden="true" className="h-10 w-px animate-pulse bg-[var(--primary-color)]/40" />
      </div>
    </section>
  );
}
