import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AboutExperience } from '@/features/about';
import { ClientMessages, CLIENT_NAMESPACES } from '@/i18n/ClientMessages';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

/** Tiêu đề / mô tả riêng cho trang Câu chuyện (SEO + chia sẻ mạng xã hội) */
export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AboutPage.meta' });
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      images: ['/images/ex6.jpg'],
    },
  };
}

/** Trang cấp 1 (ngay dưới trang chủ) — không cần breadcrumb, hero bắt đầu ngay dưới header */
export default function AboutPage() {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.about}>
      <AboutExperience />
    </ClientMessages>
  );
}
