import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { type HeroMetric } from '../types/home.types';

interface HeroBannerProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
  imageAlt: string;
  note: string;
  metrics: HeroMetric[];
}

export function HeroBanner({
  eyebrow,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  imageAlt,
  note,
  metrics,
}: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden bg-[#FAF7F5]">
      <div className="mx-auto grid min-h-[calc(70vh-80px)] w-full max-w-7xl items-center gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-8 xl:gap-12">
        <div className="relative z-10 flex max-w-2xl flex-col lg:py-10">
          <p className="mb-4 font-[family-name:var(--font-lora)] text-xs font-semibold uppercase tracking-[3px] text-[#800020]">
            {eyebrow}
          </p>
          <h1 className="max-w-[680px] font-[family-name:var(--font-playfair)] text-[40px] font-semibold leading-[1.08] text-[#800020] sm:text-[58px] lg:text-[64px] xl:text-[72px]">
            {title}
          </h1>
          <p className="mt-6 max-w-[620px] font-[family-name:var(--font-lora)] text-base leading-8 text-[#2A2525] sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-[#800020] px-6 text-xs font-semibold uppercase tracking-[2px] text-white transition-colors hover:bg-[#2A2525]"
            >
              {primaryAction}
              <ArrowRight size={16} strokeWidth={1.8} />
            </Link>
            <Link
              href="/about"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#800020]/20 bg-white/70 px-6 text-xs font-semibold uppercase tracking-[2px] text-[#800020] transition-colors hover:border-[#800020] hover:bg-white"
            >
              {secondaryAction}
            </Link>
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-y border-[#E2A79E]/35 py-5">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <dt className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#800020]">
                  {metric.value}
                </dt>
                <dd className="mt-1 text-xs leading-5 text-[#706565]">{metric.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-[720px] lg:mx-0">
          <div className="relative min-h-[390px] overflow-hidden bg-[#F3ECE7] px-5 pb-8 pt-8 sm:min-h-[500px] sm:px-8 lg:min-h-[610px]">
            <div className="absolute inset-5 border-[12px] border-white sm:inset-8 sm:border-[14px]" />
            <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-[family-name:var(--font-playfair)] text-[72px] font-semibold uppercase leading-none text-white/75 sm:text-[118px] lg:text-[138px]">
              Grace
            </p>
            <div className="absolute left-1/2 top-[48%] flex w-[92%] max-w-[680px] -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:w-[86%]">
              <Image
                src="/logoPage.png"
                alt={imageAlt}
                width={1400}
                height={768}
                priority
                className="h-auto w-full object-contain drop-shadow-[0_30px_45px_rgba(128,0,32,0.18)]"
              />
            </div>
          </div>

          <div className="absolute -right-1 top-5 max-w-[210px] border border-[#E2A79E]/35 bg-white/90 px-4 py-3 text-xs leading-5 text-[#706565] shadow-sm backdrop-blur sm:right-6 lg:right-4 xl:-right-8">
            {note}
          </div>
        </div>
      </div>
    </section>
  );
}
