import React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { Reveal } from '@/components/shared/Reveal';
import { ActionLink } from '@/components/shared/ActionLink';
import { ON_PRIMARY_COLORS } from '@/components/shared/ActionButton';

const BESPOKE_STEPS = ['1', '2', '3', '4'] as const;

/**
 * Khối nền đỏ đô duy nhất trên trang — đổi nhịp thị giác, đánh dấu điểm khác biệt (may đo theo số đo)
 * và đặt CTA chuyển đổi chính ngay sau phần kể chuyện, khi khách đã đủ tin tưởng.
 */
export function BespokeService() {
  const t = useTranslations('HomePage.bespoke');

  return (
    <section className="relative overflow-hidden bg-[var(--primary-color)] py-20 text-white sm:py-28">
      {/* Hoạ tiết vòng tròn mờ gợi hoa văn đồng tiền */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-[360px] rounded-full border border-white/10" />

      <div className="relative mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10 xl:px-16">
        <SectionHeading index="04" tone="dark" eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

        <ol className="grid gap-px overflow-hidden border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
          {BESPOKE_STEPS.map((step, i) => (
            <li key={step} className="bg-[var(--primary-color)]">
              <Reveal delay={i * 0.1} className="flex h-full flex-col p-7 sm:p-8">
                <span className="font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-none text-white/20">0{step}</span>
                <h3 className="mt-6 font-[family-name:var(--font-playfair)] text-xl font-semibold text-white">{t(`steps.${step}.title`)}</h3>
                <p className="mt-3 text-sm leading-7 text-white/75">{t(`steps.${step}.desc`)}</p>
              </Reveal>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col items-center gap-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Nền khối là đỏ đô → dùng bộ màu dựng sẵn ON_PRIMARY_COLORS (đồng bộ với Newsletter ở footer) */}
            <ActionLink
              href="/contact"
              variant="custom"
              size="lg"
              icon={<ArrowRight strokeWidth={1.6} />}
              iconPosition="end"
              colors={ON_PRIMARY_COLORS.solid}
            >
              {t('primaryAction')}
            </ActionLink>
            <ActionLink href="/faqs" variant="custom" size="lg" colors={ON_PRIMARY_COLORS.outline}>
              {t('secondaryAction')}
            </ActionLink>
          </div>
          <p className="text-xs tracking-wide text-white/60">{t('note')}</p>
        </div>
      </div>
    </section>
  );
}
