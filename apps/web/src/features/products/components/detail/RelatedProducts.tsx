'use client';

import { ContentCarousel } from '@/components/shared/ContentCarousel';
import { ProductCard } from '../ProductCard';
import { RelatedProductItem } from '../../types/products.types';

interface RelatedProductsProps {
  relatedProducts: RelatedProductItem[];
  title: string;
}

/** Sản phẩm liên quan: băng chuyền dùng chung ContentCarousel (kéo/vuốt, tự trôi, nút Trước / Sau) */
export default function RelatedProducts({ relatedProducts, title }: RelatedProductsProps) {
  return (
    <ContentCarousel
      className="mt-14 sm:mt-16 lg:mt-20"
      title={title}
      items={relatedProducts}
      getKey={(item) => item.id}
      slideClassName="basis-[68%] sm:basis-[42%] md:basis-1/3 lg:basis-1/4"
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
