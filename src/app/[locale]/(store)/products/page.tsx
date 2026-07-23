import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { ProductBanner } from '@/components/products/ProductBanner';
import { Container } from '@/components/ui/container';
import { ProductsCollection } from '@/features/products/components/ProductsCollection';
import { getTranslations } from 'next-intl/server';

async function Products() {
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
      <ProductsCollection />
    </Container>
  );
}

export default Products;
