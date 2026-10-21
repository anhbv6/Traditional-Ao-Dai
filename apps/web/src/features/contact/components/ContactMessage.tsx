import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared/Reveal';
import { SectionIntro } from '@/components/shared/SectionIntro';
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
      <Container spacing="section" className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 xl:gap-20">
        <Reveal>
          <SectionIntro eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

          <ol className="mt-8 border-t border-[var(--text-main)]/80 sm:mt-10">
            {stepKeys.map((key, index) => (
              <li key={key} className="grid grid-cols-[2.25rem_1fr] gap-2 border-b border-[var(--border)] py-4 sm:py-5">
                <span className="font-[family-name:var(--font-playfair)] text-lg italic text-[var(--primary-ink)]">{index + 1}.</span>
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
      </Container>
    </section>
  );
}
