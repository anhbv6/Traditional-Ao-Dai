import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/shared/Reveal';
import { CONTACT_CHANNELS } from '../data/contact.data';
import { ContactInfoItem } from './ContactInfoItem';

/**
 * Mở đầu trang: tiêu đề căn trái kiểu biên tập (đồng bộ trang Câu chuyện),
 * ngay dưới là dải 3 kênh liên hệ nhanh — khách cần gọi ngay thì không phải cuộn tìm.
 */
export function ContactIntro() {
  const t = useTranslations('ContactPage.intro');

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-20 lg:px-10 xl:px-16">
      <Reveal className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3.5px] text-[var(--primary-color)]">{t('eyebrow')}</p>
          <h1 className="mt-5 max-w-2xl font-[family-name:var(--font-playfair)] text-[36px] font-semibold leading-[1.1] text-[var(--text-main)] sm:text-[50px] xl:text-[56px]">
            {t('title')}
          </h1>
        </div>
        <p className="max-w-lg text-[15px] leading-7 text-[var(--text-light)] sm:text-base sm:leading-8 lg:justify-self-end">
          {t('subtitle')}
        </p>
      </Reveal>

      <Reveal delay={0.12}>
        <dl className="mt-12 grid divide-y divide-[var(--border)] border-y border-[var(--text-main)]/80 sm:mt-16 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <ContactInfoItem label={t('phone.label')} value={t('phone.value')} note={t('phone.note')} href={CONTACT_CHANNELS.phoneHref} />
          <ContactInfoItem label={t('zalo.label')} value={t('zalo.value')} note={t('zalo.note')} href={CONTACT_CHANNELS.zaloHref} external />
          <ContactInfoItem label={t('email.label')} value={t('email.value')} note={t('email.note')} href={CONTACT_CHANNELS.emailHref} />
        </dl>
      </Reveal>
    </section>
  );
}
