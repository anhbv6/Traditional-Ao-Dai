import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/shared/Reveal';
import { stepKeys } from '../types/contact.types';
import { ContactForm } from './ContactForm';

/**
 * Khối gửi lời nhắn trên nền be: bên trái nói rõ điều gì xảy ra sau khi gửi
 * (khách yên tâm hơn một nút "Gửi" trơn), bên phải là form.
 */
export function ContactMessage() {
  const t = useTranslations('ContactPage.message');

  return (
    <section className="bg-[var(--bg-secondary)]">
      <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-10 xl:px-16">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--primary-color)]">{t('eyebrow')}</p>
          <h2 className="mt-4 max-w-md font-[family-name:var(--font-playfair)] text-[30px] font-semibold leading-tight text-[var(--text-main)] sm:text-[38px]">
            {t('title')}
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-[var(--text-light)]">{t('description')}</p>

          <ol className="mt-10 border-t border-[var(--text-main)]/80">
            {stepKeys.map((key, index) => (
              <li key={key} className="grid grid-cols-[2.5rem_1fr] gap-2 border-b border-[var(--border)] py-5">
                <span className="font-[family-name:var(--font-playfair)] text-lg italic text-[var(--primary-color)]">{index + 1}.</span>
                <div>
                  <p className="font-semibold text-[var(--text-main)]">{t(`steps.${key}.title`)}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-light)]">{t(`steps.${key}.description`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={0.12}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
