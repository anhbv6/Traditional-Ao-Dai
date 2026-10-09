import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import { Reveal } from '@/components/shared/Reveal';

const COLLECTIONS = [
  { key: 'tet', image: '/images/login1.jpg', position: 'object-[50%_35%]', featured: true },
  { key: 'modern', image: '/images/login2.jpg', position: 'object-[50%_25%]', featured: false },
  { key: 'wedding', image: '/login_banner.jpg', position: 'object-[50%_35%]', featured: false },
] as const;

/**
 * Bố cục bất đối xứng 1 lớn + 2 nhỏ kiểu tạp chí thời trang:
 * mắt dừng ở ảnh lớn trước, rồi quét sang phải — tự nhiên kéo dài thời gian xem.
 */
export function FeaturedCollections() {
  const t = useTranslations('HomePage.featuredCollections');

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 xl:px-16">
      <SectionHeading index="01" eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:grid-rows-2 lg:gap-6">
        {COLLECTIONS.map((item, i) => (
          <Reveal key={item.key} delay={i * 0.12} className={cn(item.featured && 'lg:row-span-2')}>
            <Link
              href="/products"
              className={cn(
                'group relative block h-full overflow-hidden bg-[var(--bg-secondary)]',
                item.featured ? 'aspect-[4/5] lg:aspect-auto lg:min-h-[720px]' : 'aspect-[4/3] lg:aspect-auto lg:min-h-[348px]',
              )}
            >
              <Image
                src={item.image}
                alt={t(`items.${item.key}.name`)}
                fill
                sizes={item.featured ? '(max-width: 1024px) 100vw, 55vw' : '(max-width: 1024px) 100vw, 45vw'}
                className={cn(
                  'object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]',
                  item.position,
                )}
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#2A0A12]/80 via-[#2A0A12]/10 to-transparent" />
              {/* Khung viền mảnh hiện ra khi rê chuột — chi tiết sang trọng, không phô trương */}
              <div aria-hidden="true" className="absolute inset-4 border border-white/0 transition-colors duration-500 group-hover:border-white/50" />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 sm:p-8">
                <div className="max-w-md">
                  <p className="font-[family-name:var(--font-playfair)] text-sm text-white/70">0{i + 1}</p>
                  <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-white sm:text-3xl">
                    {t(`items.${item.key}.name`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/80 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:transition-all lg:duration-500 lg:group-hover:max-h-24 lg:group-hover:opacity-100">
                    {t(`items.${item.key}.desc`)}
                  </p>
                </div>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/60 text-white transition-colors duration-300 group-hover:bg-white group-hover:text-[var(--primary-color)]">
                  <ArrowUpRight size={18} strokeWidth={1.5} />
                  <span className="sr-only">{t('explore')}</span>
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
export default FeaturedCollections;
