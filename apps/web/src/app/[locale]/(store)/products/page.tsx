import { Container } from '@/components/ui/container';
import { ProductsCollection, ProductBanner, ProductEventBanner } from '@/features/products';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

async function Products({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialCategory = params.category;
  const initialQuery = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const t = await getTranslations('ProductsPage');

  return (
    <>
      <ProductEventBanner />
      <Container as="section" className="py-12">
        <ProductBanner eyebrow={t('banner.eyebrow')} title={t('banner.title')} subtitle={t('banner.subtitle')} />
        {/* key theo danh mục + từ khóa: đổi ?category= (CTA banner) hoặc ?q= (tìm kiếm trên header) sẽ dựng lại bộ lọc */}
        <ProductsCollection
          key={`${initialCategory ?? 'all'}|${initialQuery}`}
          initialCategory={initialCategory}
          initialQuery={initialQuery}
        />
      </Container>
    </>
  );
}

export default Products;
