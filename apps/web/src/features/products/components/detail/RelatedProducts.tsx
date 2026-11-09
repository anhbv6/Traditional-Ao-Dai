'use client';

import { ContentCarousel } from '@/components/shared/ContentCarousel';
import { ProductCard } from '../ProductCard';
import { type RelatedProductItem } from '../../types/products.types';

interface RelatedProductsProps {
  relatedProducts: RelatedProductItem[];
  title: string;
}

/**
 * Sản phẩm liên quan: tối đa 5 thẻ nhỏ (server đã cắt) — desktop vừa đủ một hàng, không phải trượt;
 * màn nhỏ hơn dùng băng chuyền ContentCarousel để kéo / vuốt.
 */
export default function RelatedProducts({ relatedProducts, title }: RelatedProductsProps) {
  return (
    <ContentCarousel
      className="mt-12 pt-10 sm:mt-14 lg:mt-16 lg:pt-12"
      title={title}
      items={relatedProducts}
      getKey={(item) => item.id}
      slideClassName="basis-[46%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
      renderItem={(item) => (
        <ProductCard
          imageSrc={item.imageSrc}
          hoverImageSrc={item.hoverImageSrc}
          imageAlt={item.imageAlt}
          name={item.name}
          description={item.description}
          price={item.price}
          priceValue={item.priceValue}
          slug={item.id}
          originalPrice={item.originalPrice}
          colorSwatches={item.colors}
          sizes={item.sizes}
          material={item.material}
          purchaseType={item.purchaseType}
          productHref={`/products/${item.id}`}
        />
      )}
    />
  );
}
