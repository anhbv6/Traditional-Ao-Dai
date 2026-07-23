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
    <section className='pt-4'>
        <div>
            <div className="relative">
                <SectionHeading
                    eyebrow={t('eyebrow')}
                    title={t('title')}
                    description={t('description')}
                    className='sm:mb-9'
                />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:mt-10 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 xl:gap-x-8">
                {mockProducts.map((product, index) => (
                    <div 
                        key={product.id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 120}ms` }}
                    >
                        <ProductCard
                            imageSrc={product.imageSrc}
                            imageAlt={product.imageAlt}
                            name={product.name[locale]}
                            description={product.description[locale]}
                            price={product.price[locale]}
                            originalPrice={product.originalPrice?.[locale]}
                        />
                    </div>
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
