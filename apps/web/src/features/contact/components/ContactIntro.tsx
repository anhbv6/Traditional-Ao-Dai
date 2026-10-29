import { useTranslations } from 'next-intl';
import { Mail, Phone } from 'lucide-react';
import { ZaloIcon } from '@/components/layout/footer/ZaloIcon';
import { Container } from '@/components/layout/Container';
import { PageIntro } from '@/components/shared/PageIntro';
import { Reveal } from '@/components/shared/Reveal';
import { CONTACT_CHANNELS } from '../constants/contactInfo';
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
          <ContactInfoItem icon={Phone} label={t('phone.label')} value={t('phone.value')} note={t('phone.note')} href={CONTACT_CHANNELS.phoneHref} />
          <ContactInfoItem icon={ZaloIcon} iconSize={26} pulseDelay={0.9} label={t('zalo.label')} value={t('zalo.value')} note={t('zalo.note')} href={CONTACT_CHANNELS.zaloHref} external />
          <ContactInfoItem icon={Mail} pulseDelay={1.8} label={t('email.label')} value={t('email.value')} note={t('email.note')} href={CONTACT_CHANNELS.emailHref} />
        </dl>
      </Reveal>
    </Container>
  );
}
