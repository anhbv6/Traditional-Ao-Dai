'use client';

import { ProductCard } from '@/features/products';
import { RelatedProductItem } from '../../types/products.types';

interface RelatedProductsProps {
  relatedProducts: RelatedProductItem[];
  title: string;
}

export default function RelatedProducts({ relatedProducts, title }: RelatedProductsProps) {
  return (
    <section className="mt-16">
      <h2 className="text-3xl text-[var(--text-main)]">{title}</h2>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-7">
        {relatedProducts.map((item) => (
          <ProductCard
            key={item.id}
            imageSrc={item.imageSrc}
            hoverImageSrc={item.hoverImageSrc}
            imageAlt={item.imageAlt}
            name={item.name}
            description={item.description}
            price={item.price}
            originalPrice={item.originalPrice}
            colorSwatches={item.colors}
            sizes={item.sizes}
            material={item.material}
            purchaseType={item.purchaseType}
            productHref={`/products/${item.id}`}
          />
        ))}
      </div>
    </section>
  );
}
