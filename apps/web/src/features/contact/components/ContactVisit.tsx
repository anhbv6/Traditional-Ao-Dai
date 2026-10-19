import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/shared/Reveal';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { CONTACT_MAP } from '../data/contact.data';

/**
 * Dải nền đỏ thẫm (cùng tông với hero/CTA trang Câu chuyện): bản đồ một bên,
 * địa chỉ + giờ mở cửa + chỉ đường một bên — phần dành cho khách muốn ghé thử đồ.
 */
export function ContactVisit() {
  const t = useTranslations('ContactPage.visit');

  return (
    <section className="bg-[var(--bg-wine)] text-white">
      <div className="mx-auto grid w-full max-w-(--page-max-width) lg:grid-cols-2">
        <div className="relative min-h-[280px] sm:min-h-[380px]">
          <iframe
            title={t('mapTitle')}
            src={CONTACT_MAP.embedSrc}
            className="absolute inset-0 h-full w-full grayscale-[0.35]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <Reveal className="flex flex-col justify-center px-5 py-14 sm:px-10 sm:py-16 xl:px-16 2xl:px-20 2xl:py-20">
          <SectionIntro tone="onDark" eyebrow={t('eyebrow')} title={t('title')} />

          {/* Laptop nhỏ: nửa màn hình hẹp nên xếp dọc địa chỉ / giờ mở cửa */}
          <dl className="mt-8 grid gap-6 border-l border-[var(--accent-color)]/60 pl-5 sm:mt-10 sm:grid-cols-[1.4fr_1fr] sm:gap-10 sm:pl-6 lg:grid-cols-1 lg:gap-6 xl:grid-cols-[1.4fr_1fr] xl:gap-10">
            <div>
              <dt className="text-[11px] uppercase tracking-[2.5px] text-white/55">{t('addressLabel')}</dt>
              <dd className="mt-2 text-[15px] leading-7 text-white/90">{t('address')}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[2.5px] text-white/55">{t('hoursLabel')}</dt>
              <dd className="mt-2 text-[15px] leading-7 text-white/90">
                {t('hours')}
                <span className="block text-white/60">{t('days')}</span>
              </dd>
            </div>
          </dl>

          <p className="mt-8 max-w-md text-sm leading-6 text-white/65 sm:mt-10">{t('note')}</p>

          <a
            href={CONTACT_MAP.directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-6 inline-flex min-h-12 w-fit items-center gap-4 border-b border-white/40 pb-2 text-xs font-semibold uppercase tracking-[2.5px] text-white transition-colors duration-300 hover:border-[var(--accent-on-primary)] hover:text-[var(--accent-on-primary)] sm:mt-8"
          >
            {t('directions')}
            <ArrowUpRight size={16} strokeWidth={1.4} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
