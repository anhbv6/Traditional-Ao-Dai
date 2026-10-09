import { useTranslations } from 'next-intl';
import { ArrowRight, Plus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Reveal } from '@/components/shared/Reveal';
import { faqKeys } from '../types/contact.types';

/**
 * Vài câu hỏi hay gặp trước khi liên hệ — dạng danh sách mở/đóng bằng <details> gốc
 * (không cần JS, bàn phím dùng được), kèm lối sang trang FAQ đầy đủ.
 */
export function ContactFaq() {
  const t = useTranslations('ContactPage.faq');

  return (
    <section className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-10 xl:px-16">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--primary-color)]">{t('eyebrow')}</p>
        <h2 className="mt-4 max-w-sm font-[family-name:var(--font-playfair)] text-[30px] font-semibold leading-tight text-[var(--text-main)] sm:text-[38px]">
          {t('title')}
        </h2>
        <Link
          href="/faqs"
          className="group mt-8 inline-flex items-center gap-3 border-b border-[var(--text-main)]/40 pb-1.5 text-xs font-semibold uppercase tracking-[2px] text-[var(--text-main)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
        >
          {t('viewAll')}
          <ArrowRight size={15} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </Reveal>

      <Reveal delay={0.12} className="border-t border-[var(--text-main)]/80">
        {faqKeys.map((key) => (
          <details key={key} className="group border-b border-[var(--border)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left font-[family-name:var(--font-playfair)] text-lg font-semibold text-[var(--text-main)] transition-colors hover:text-[var(--primary-color)] sm:text-xl [&::-webkit-details-marker]:hidden">
              {t(`items.${key}.question`)}
              <Plus
                size={20}
                strokeWidth={1.4}
                className="shrink-0 text-[var(--primary-color)] transition-transform duration-300 group-open:rotate-45"
              />
            </summary>
            <p className="max-w-2xl pb-6 pr-10 text-[15px] leading-7 text-[var(--text-light)]">{t(`items.${key}.answer`)}</p>
          </details>
        ))}
      </Reveal>
    </section>
  );
}
