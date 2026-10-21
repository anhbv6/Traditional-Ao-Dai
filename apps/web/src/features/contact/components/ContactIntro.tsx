import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout/Container';
import { PageIntro } from '@/components/shared/PageIntro';
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
    <Container as="section" spacing="section" className="pt-(--page-y)">
      <PageIntro eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <Reveal delay={0.12}>
        <dl className="mt-10 grid divide-y divide-[var(--border)] border-y border-[var(--text-main)]/80 sm:mt-14 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <ContactInfoItem label={t('phone.label')} value={t('phone.value')} note={t('phone.note')} href={CONTACT_CHANNELS.phoneHref} />
          <ContactInfoItem label={t('zalo.label')} value={t('zalo.value')} note={t('zalo.note')} href={CONTACT_CHANNELS.zaloHref} external />
          <ContactInfoItem label={t('email.label')} value={t('email.value')} note={t('email.note')} href={CONTACT_CHANNELS.emailHref} />
        </dl>
      </Reveal>
    </Container>
  );
}
