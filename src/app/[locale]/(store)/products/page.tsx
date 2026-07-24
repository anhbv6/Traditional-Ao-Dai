import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { ProductBanner } from '@/components/common/product/ProductBanner';
import { Container } from '@/components/ui/container';
import { ProductsCollection } from '@/features/products/components/ProductsCollection';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

async function Products({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialCategory = params.category;
  const t = await getTranslations('ProductsPage');

  const morphingTexts = [
    t('banner.morph1'),
    t('banner.morph2'),
    t('banner.morph3'),
    t('banner.morph4'),
    t('banner.morph5'),
  ];

  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <ProductBanner title={t('banner.title')} subtitle={t('banner.subtitle')} texts={morphingTexts} />
      <ProductsCollection initialCategory={initialCategory} />
    </Container>
  );
}

export default Products;
