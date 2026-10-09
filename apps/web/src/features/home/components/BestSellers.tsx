'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import { ProductCard, mockProducts, productCatalog } from '@/features/products';
import { parseVndString } from '@/features/cart';

/** Tab theo dịp mặc → danh mục sản phẩm tương ứng (null = tất cả) */
const OCCASION_TABS = [
  { key: 'all', category: null },
  { key: 'wedding', category: 'Áo dài Cưới' },
  { key: 'tet', category: 'Áo dài Lễ/Tết' },
  { key: 'modern', category: 'Áo dài Cách tân' },
] as const;

type OccasionKey = (typeof OCCASION_TABS)[number]['key'];

const VISIBLE_COUNT = 4;

/**
 * Trang đầu của catalog (id dạng "1-2") — trang chi tiết tra sản phẩm theo id catalog,
 * dùng id của mockProducts ("2") sẽ ra 404.
 */
const FEATURED_PRODUCTS = productCatalog.slice(0, mockProducts.length);

/**
 * Chỉ hiển thị 4 sản phẩm + tab chọn theo dịp: ít lựa chọn hơn giúp dễ quyết định,
 * thao tác bấm tab khiến khách tương tác (và ở lại) lâu hơn so với lưới 8 sản phẩm tĩnh.
 */
export function BestSellers() {
  const t = useTranslations('HomePage.bestSellers');
  const locale = useLocale() as 'vi' | 'en';
  const [activeTab, setActiveTab] = useState<OccasionKey>('all');

  const category = OCCASION_TABS.find((tab) => tab.key === activeTab)?.category ?? null;
  const products = FEATURED_PRODUCTS
    .filter((product) => category === null || product.category === category)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, VISIBLE_COUNT);

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10 xl:px-16">
        <SectionHeading index="02" eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

        <div role="tablist" aria-label={t('eyebrow')} className="-mt-2 mb-10 flex justify-center gap-1 sm:gap-2">
          {OCCASION_TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative shrink-0 cursor-pointer px-4 py-2 text-xs font-semibold uppercase tracking-[2px] transition-colors duration-300',
                  isActive ? 'text-[var(--primary-color)]' : 'text-[var(--text-light)] hover:text-[var(--primary-color)]',
                )}
              >
                {t(`tabs.${tab.key}`)}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-4 -bottom-px h-px origin-center bg-[var(--primary-color)] transition-transform duration-300',
                    isActive ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </button>
            );
          })}
        </div>

        <div key={activeTab} role="tabpanel" className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product, index) => (
            <div key={product.id} className="animate-fade-in-soft" style={{ animationDelay: `${index * 120}ms` }}>
              <ProductCard
                imageSrc={product.imageSrc}
                hoverImageSrc={product.hoverImageSrc}
                imageAlt={product.imageAlt}
                name={product.name[locale]}
                description={product.description[locale]}
                price={product.price[locale]}
                priceValue={product.numericPrice}
                slug={product.id}
                originalPrice={product.originalPrice?.[locale]}
                originalPriceValue={product.originalPrice ? parseVndString(product.originalPrice.vi) : undefined}
                colorSwatches={product.colors}
                sizes={product.sizes}
                material={product.material}
                purchaseType={product.purchaseType}
                productHref={`/products/${product.id}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href="/products"
            className="group inline-flex items-center gap-3 border-b border-[var(--primary-color)]/40 pb-1 text-xs font-semibold uppercase tracking-[2px] text-[var(--primary-color)] transition-colors hover:border-[var(--primary-color)]"
          >
            {t('viewAll')}
            <ArrowRight size={15} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
export default BestSellers;
