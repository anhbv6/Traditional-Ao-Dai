import { Container } from '@/components/ui/container';
import { PageIntro } from '@/components/shared/PageIntro';
import { ProductsCollection, ProductEventBanner, type ProductFilterParams } from '@/features/products';
import { getTranslations } from 'next-intl/server';
import { ClientMessages, CLIENT_NAMESPACES } from '@/i18n/ClientMessages';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Lấy một giá trị chuỗi của tham số URL (bỏ qua dạng mảng `?a=1&a=2`) */
const pickParam = (value: string | string[] | undefined) => (typeof value === 'string' ? value.slice(0, 100) : undefined);

async function Products({ searchParams }: PageProps) {
  const params = await searchParams;
  const filterParams: ProductFilterParams = {
    category: pickParam(params.category),
    type: pickParam(params.type),
    color: pickParam(params.color),
    material: pickParam(params.material),
    maxPrice: pickParam(params.maxPrice),
  };
  const initialQuery = pickParam(params.q)?.trim() ?? '';
  const t = await getTranslations('ProductsPage');

  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.products}>
      <ProductEventBanner />
      <Container as="section">
        <PageIntro eyebrow={t('banner.eyebrow')} title={t('banner.title')} subtitle={t('banner.subtitle')} />
        {/* key theo bộ lọc URL + từ khóa: đổi ?category= (CTA banner), ?q= (tìm kiếm header)… sẽ dựng lại bộ lọc */}
        <ProductsCollection
          key={`${Object.values(filterParams).join('|')}|${initialQuery}`}
          filterParams={filterParams}
          initialQuery={initialQuery}
        />
      </Container>
    </ClientMessages>
  );
}

export default Products;
