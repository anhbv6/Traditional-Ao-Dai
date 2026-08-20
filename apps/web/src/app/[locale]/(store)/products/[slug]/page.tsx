import React from 'react';
import { ProductDetail, mockDetailProducts, productCatalog } from '@/features/products';
import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

type Locale = 'vi' | 'en';

interface DetailProductsProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: DetailProductsProps) {
  const { locale, slug } = await params;
  
  if (slug in mockDetailProducts) {
    const mock = mockDetailProducts[slug];
    return {
      title: mock.seo.title,
      description: mock.seo.description,
      openGraph: {
        images: [mock.seo.og_image],
      },
    };
  }

  const product = productCatalog.find((item) => item.id === decodeURIComponent(slug));
  if (product) {
    return {
      title: `${product.name[locale]} - Traditional Ao Dai`,
      description: product.description[locale],
      openGraph: {
        images: [product.imageSrc],
      },
    };
  }

  return {
    title: 'Chi tiết sản phẩm - Traditional Ao Dai',
  };
}

export default async function DetailProductsPage({ params }: DetailProductsProps) {
  const { locale, slug } = await params;

  let productName = '';
  if (slug in mockDetailProducts) {
    productName = mockDetailProducts[slug].name;
  } else {
    const product = productCatalog.find((item) => item.id === decodeURIComponent(slug));
    if (product) productName = product.name[locale];
  }

  return (
    <Container as="section" className="py-10 sm:py-12">
      <Breadcrumbs lastLabel={productName} />
      <ProductDetail slug={slug} locale={locale} />
    </Container>
  );
}
