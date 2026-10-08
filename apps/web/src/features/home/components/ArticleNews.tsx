'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SectionHeading } from './SectionHeading';
import Carousel from '@/components/effects/Carousel';
import { mockArticles, NewsCard } from '@/features/news';

export function ArticleNews() {
  const t = useTranslations('HomePage.articleNews');
  const locale = useLocale() as 'vi' | 'en';

  // Map bilingual mock data to plain objects depending on current locale
  const carouselItems = mockArticles.map(article => ({
    id: article.id,
    slug: article.slug,
    category: article.category[locale] || article.category.vi,
    title: article.title[locale] || article.title.vi,
    description: article.description[locale] || article.description.vi,
    dateShort: article.dateShort[locale] || article.dateShort.vi,
    dateLong: article.dateLong[locale] || article.dateLong.vi,
    imageSrc: article.imageSrc,
    readTime: article.readTime[locale] || article.readTime.vi,
  }));

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1440px]">
        {/* Section Header */}
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          className="sm:mb-0"
        />

        {/* Carousel Section */}
        <div className="w-full select-none">
          <Carousel
            items={carouselItems}
            autoplay={true}
            autoplayDelay={5000}
            loop={true}
            renderItem={(item) => (
              <NewsCard
                slug={item.slug}
                category={item.category}
                title={item.title}
                description={item.description}
                dateShort={item.dateShort}
                dateLong={item.dateLong}
                imageSrc={item.imageSrc}
                readTime={item.readTime}
                readMoreLabel={t('readMore')}
              />
            )}
          />
        </div>
      </div>
    </section>
  );
}
export default ArticleNews;
