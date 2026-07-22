import { Link } from '@/i18n/routing';
import { ArrowDown } from 'lucide-react';
import React from 'react'
import SectionHeading from './SectionHeading';
import ProductCard from '@/features/products/components/ProductCard';
import { mockProducts } from '@/features/products/data/mockProducts';
import { useLocale, useTranslations } from 'next-intl';

function BestSellers() {
  const t = useTranslations('HomePage.bestSellers');
  const locale = useLocale() as 'vi' | 'en';

  return (
    <section className="bg-[#FAF7F5] px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
            <div className="relative">
                <SectionHeading
                    eyebrow={t('eyebrow')}
                    title={t('title')}
                    description={t('description')}
                />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                {mockProducts.map((product) => (
                    <ProductCard
                        key={product.id}
                        imageSrc={product.imageSrc}
                        imageAlt={product.imageAlt}
                        name={product.name[locale]}
                        description={product.description[locale]}
                        price={product.price[locale]}
                        originalPrice={product.originalPrice?.[locale]}
                    />
                ))}
            </div>
        </div>

        <div className="relative mt-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-[color:var(--bg-secondary)]" />
            </div>
            <div className="relative">
                <Link
                    href="/products"
                    className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--primary-color)] shadow-md hover:bg-[var(--primary-color)] hover:text-white transition-all duration-500 ease-out border-none"
                    aria-label={t('viewAll')}
                >
                    <ArrowDown size={20} className="animate-bounce" />
                </Link>
            </div>
        </div>
    </section>
  )
}

export default BestSellers
