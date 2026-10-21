import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/container';
import { BespokeExperience } from '@/features/bespoke';
import { ClientMessages, CLIENT_NAMESPACES } from '@/i18n/ClientMessages';

interface CustomPageProps {
  params: Promise<{ locale: string }>;
}

/** Tiêu đề / mô tả riêng cho màn May áo dài theo yêu cầu (SEO + chia sẻ) */
export async function generateMetadata({ params }: CustomPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'BespokePage.meta' });
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description'), images: ['/images/ex6.jpg'] },
  };
}

/** May áo dài theo yêu cầu — tràn màn như Giỏ hàng / Thanh toán (cột tóm tắt bên phải) */
export default function CustomPage() {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.custom}>
      <Container as="section" width="full">
        <BespokeExperience />
      </Container>
    </ClientMessages>
  );
}
