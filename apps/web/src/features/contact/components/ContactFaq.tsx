import { useTranslations } from 'next-intl';
import { ArrowRight, Plus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared/Reveal';
import { SectionIntro } from '@/components/shared/SectionIntro';
import { faqKeys } from '../types/contact.types';

/**
 * Vài câu hỏi hay gặp trước khi liên hệ — dạng danh sách mở/đóng bằng <details> gốc
 * (không cần JS, bàn phím dùng được), kèm lối sang trang FAQ đầy đủ.
 */
export function ContactFaq() {
  const t = useTranslations('ContactPage.faq');

  return (
    <Container as="section" spacing="section" className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 xl:gap-20">
      <Reveal>
        <SectionIntro eyebrow={t('eyebrow')} title={t('title')} />
        <Link
          href="/faqs"
          className="group mt-6 inline-flex items-center gap-3 border-b border-[var(--text-main)]/40 pb-1.5 text-xs font-semibold uppercase tracking-[2px] text-[var(--text-main)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)] sm:mt-8"
        >
          {t('viewAll')}
          <ArrowRight size={15} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </Reveal>

      <Reveal delay={0.12} className="border-t border-[var(--text-main)]/80">
        {faqKeys.map((key) => (
          <details key={key} className="group border-b border-[var(--border)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-[family-name:var(--font-playfair)] text-[1.0625rem] font-semibold text-[var(--text-main)] transition-colors hover:text-[var(--primary-ink)] sm:py-6 sm:text-lg 2xl:text-xl [&::-webkit-details-marker]:hidden">
              {t(`items.${key}.question`)}
              <Plus
                size={20}
                strokeWidth={1.4}
                className="shrink-0 text-[var(--primary-ink)] transition-transform duration-300 group-open:rotate-45"
              />
            </summary>
            <p className="max-w-2xl pb-5 pr-8 text-[15px] leading-7 text-[var(--text-light)] sm:pb-6 sm:pr-10">{t(`items.${key}.answer`)}</p>
          </details>
        ))}
      </Reveal>
    </Container>
  );
}
