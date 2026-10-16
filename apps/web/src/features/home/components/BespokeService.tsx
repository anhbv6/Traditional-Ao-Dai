import React from 'react';
import Image from 'next/image';
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
 *
 * Bố cục 2 cột cho dễ đọc:
 * - Trái: tiêu đề + CTA + ảnh minh hoạ (ảnh chỉ hiện từ desktop, dính theo khi cuộn).
 * - Phải: 4 bước dạng dòng thời gian dọc — mốc thoi vàng đánh số, chữ trắng đậm độ cao (≥ 85%) trên nền đỏ.
 * Nền chuyển sắc đỏ đô sáng → sẫm thay vì một mảng phẳng để bớt chói, nội dung nổi hơn.
 */
export function BespokeService() {
  const t = useTranslations('HomePage.bespoke');

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklab,var(--primary-color)_88%,white)_0%,var(--primary-color)_45%,color-mix(in_oklab,var(--primary-color)_72%,black)_100%)] py-20 text-white sm:py-28">
      {/* Hoạ tiết vòng tròn mờ gợi hoa văn đồng tiền */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-[360px] rounded-full border border-white/10" />

      <div className="relative mx-auto grid w-full max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20 lg:px-10 xl:gap-28 xl:px-16">
        {/* ---------- Cột trái: tiêu đề + CTA + ảnh ---------- */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading index="04" tone="dark" align="left" eyebrow={t('eyebrow')} title={t('title')} description={t('description')} className="mb-8 sm:mb-8" />

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
          <p className="mt-4 flex items-center gap-2 text-xs tracking-wide text-white/80">
            <span aria-hidden="true" className="size-1.5 rotate-45 bg-[var(--accent-on-primary)]" />
            {t('note')}
          </p>

          {/* Ảnh minh hoạ — khung viền vàng mảnh lệch phía sau, đồng bộ banner / cảm nhận khách hàng */}
          <div className="relative mt-12 hidden pb-4 pr-4 lg:block">
            <div aria-hidden="true" className="absolute bottom-0 left-4 right-0 top-4 border border-[var(--accent-on-primary)]/50" />
            <div className="relative aspect-[16/10] overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
              <Image
                src="/images/ex4.jpg"
                alt={t('imageAlt')}
                fill
                sizes="(max-width: 1280px) 40vw, 520px"
                className="object-cover object-[50%_25%]"
              />
            </div>
          </div>
        </div>

        {/* ---------- Cột phải: 4 bước dạng dòng thời gian ---------- */}
        {/* self-center: cột bước cao vừa nội dung, căn giữa theo cột trái (không bị kéo giãn → đường nối không thừa) */}
        <ol className="relative lg:self-center">
          {/* Đường nối dọc qua tâm các mốc — mờ dần ở hai đầu */}
          <span aria-hidden="true" className="absolute inset-y-0 left-6 w-px bg-gradient-to-b from-transparent via-[var(--accent-on-primary)]/50 to-transparent" />

          {BESPOKE_STEPS.map((step, i) => (
            <li key={step} className="group relative border-b border-white/15 last:border-b-0">
              <Reveal delay={i * 0.1} className="flex gap-6 py-7 sm:gap-8 sm:py-8">
                {/* Mốc thoi đánh số — nền đỏ để che đường nối phía sau */}
                <span className="relative flex size-12 shrink-0 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="absolute inset-1.5 rotate-45 border border-[var(--accent-on-primary)] bg-[var(--primary-color)] transition-colors duration-500 group-hover:bg-[var(--accent-on-primary)]"
                  />
                  <span className="relative font-[family-name:var(--font-playfair)] text-base font-semibold text-[var(--accent-on-primary)] transition-colors duration-500 group-hover:text-[var(--primary-color)]">
                    0{step}
                  </span>
                </span>

                <div className="pt-1.5 transition-transform duration-500 ease-out group-hover:translate-x-1">
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-white sm:text-2xl">
                    {t(`steps.${step}.title`)}
                  </h3>
                  <p className="mt-2 max-w-md text-[15px] leading-7 text-white/85">{t(`steps.${step}.desc`)}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
