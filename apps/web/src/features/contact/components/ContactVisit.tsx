import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/shared/Reveal';
import { CONTACT_MAP } from '../data/contact.data';

/**
 * Dải nền đỏ thẫm (cùng tông với hero/CTA trang Câu chuyện): bản đồ một bên,
 * địa chỉ + giờ mở cửa + chỉ đường một bên — phần dành cho khách muốn ghé thử đồ.
 */
export function ContactVisit() {
  const t = useTranslations('ContactPage.visit');

  return (
    <section className="bg-[#2A0A12] text-white">
      <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-2">
        <div className="relative min-h-[320px] sm:min-h-[420px]">
          <iframe
            title={t('mapTitle')}
            src={CONTACT_MAP.embedSrc}
            className="absolute inset-0 h-full w-full grayscale-[0.35]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <Reveal className="flex flex-col justify-center px-5 py-16 sm:px-10 sm:py-20 lg:px-16 xl:px-20">
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--accent-color)]">{t('eyebrow')}</p>
          <h2 className="mt-4 max-w-md font-[family-name:var(--font-playfair)] text-[30px] font-semibold leading-tight text-white sm:text-[38px]">
            {t('title')}
          </h2>

          <dl className="mt-10 grid gap-8 border-l border-[var(--accent-color)]/60 pl-6 sm:grid-cols-[1.4fr_1fr] sm:gap-10">
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

          <p className="mt-10 max-w-md text-sm leading-6 text-white/65">{t('note')}</p>

          <a
            href={CONTACT_MAP.directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex min-h-12 w-fit items-center gap-4 border-b border-white/40 pb-2 text-xs font-semibold uppercase tracking-[2.5px] text-white transition-colors duration-300 hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]"
          >
            {t('directions')}
            <ArrowUpRight size={16} strokeWidth={1.4} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
