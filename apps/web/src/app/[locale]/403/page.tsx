import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/layout/Container';
import { ForbiddenView } from '@/components/feedback/ForbiddenView';
import { ClientMessages, CLIENT_NAMESPACES } from '@/i18n/ClientMessages';

interface ForbiddenPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ForbiddenPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Common.forbidden' });
  return { title: t('metaTitle'), robots: { index: false } };
}

/**
 * 403 — proxy chuyển tới đây khi khách hàng đã đăng nhập (không có phiên quản trị) cố vào /admin.
 * Nằm ngoài layout cửa hàng (không header / footer) nên tự căn giữa toàn màn hình;
 * nội dung dùng StatusScreen chung với trang 404.
 */
export default function ForbiddenPage() {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.forbidden}>
      <main className="grid min-h-svh place-items-center bg-[var(--bg-main)] font-[family-name:var(--font-lora)] text-[var(--text-main)]">
        <Container as="section" spacing="none">
          <ForbiddenView />
        </Container>
      </main>
    </ClientMessages>
  );
}
