import { Container } from '@/components/ui/container'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { ProductBanner } from '@/components/products/ProductBanner'
import { getTranslations } from 'next-intl/server'

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
      <ProductBanner
        title={t('banner.title')}
        subtitle={t('banner.subtitle')}
        texts={morphingTexts}
      />
      <div className="mt-12 text-center text-[var(--text-light)]">
        <h2 className="text-xl font-semibold">Danh sách Sản phẩm</h2>
        <p className="mt-2">Các thiết kế áo dài độc bản sẽ sớm ra mắt.</p>
      </div>
    </Container>
  )
}

export default Products