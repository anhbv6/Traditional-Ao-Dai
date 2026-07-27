'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Calendar, Clock, ChevronRight, ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { mockArticles } from '../data/mockArticles';
import NewsCard from './NewsCard';

const categoryKeys = ['all', 'guide', 'tips', 'culture', 'trends', 'tailoring'] as const;

const categoryFilterMap: Record<string, { vi: string; en: string }> = {
  guide: { vi: 'Cẩm Nang', en: 'Guide' },
  tips: { vi: 'Kinh Nghiệm', en: 'Tips' },
  culture: { vi: 'Văn Hóa', en: 'Culture' },
  trends: { vi: 'Xu Hướng', en: 'Trends' },
  tailoring: { vi: 'May Đo', en: 'Tailoring' },
};

const ITEMS_PER_PAGE = 6;

export default function NewsClient() {
  const t = useTranslations('NewsPage');
  const locale = useLocale() as 'vi' | 'en';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);

  // Filter articles based on selected category
  const filteredArticles = selectedCategory === 'all'
    ? mockArticles
    : mockArticles.filter((article) => {
        const filter = categoryFilterMap[selectedCategory];
        if (!filter) return false;
        return (
          article.category.vi.toLowerCase() === filter.vi.toLowerCase() ||
          article.category.en.toLowerCase() === filter.en.toLowerCase()
        );
      });

  // Extract featured articles (up to 3)
  const featuredArticles = filteredArticles.slice(0, 3);
  const heroArticle = featuredArticles[0];
  const sideArticles = featuredArticles.slice(1, 3);

  // Extract main grid articles (index 3 and onwards)
  const gridArticles = filteredArticles.slice(3);
  const displayedGridArticles = gridArticles.slice(0, visibleCount);

  const hasMore = gridArticles.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setVisibleCount(ITEMS_PER_PAGE); // Reset pagination on filter change
  };

  return (
    <Container as="div" className="py-8 sm:py-12">
      <Breadcrumbs />

      {/* Top Banner / Title */}
      <section className="mt-4 mb-8 text-center max-w-3xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-playfair)] text-[var(--primary-color)] leading-tight">
          {t('title')}
        </h1>
        <p className="mt-3.5 text-sm sm:text-base leading-7 text-[var(--text-light)]">
          {t('subtitle')}
        </p>
      </section>

      {/* Category Tabs */}
      <section className="mb-10">
        <div className="flex w-full items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-[var(--border)] pb-3">
          {categoryKeys.map((key) => {
            const isActive = selectedCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleCategoryChange(key)}
                className={`cursor-pointer whitespace-nowrap rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-[var(--primary-color)] text-white shadow-xs'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--primary-color)]/10 hover:text-[var(--primary-color)]'
                }`}
              >
                {t(`categories.${key}`)}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Articles Section */}
      {filteredArticles.length > 0 ? (
        <section className="mb-14">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Hero Big Card (Left) */}
            {heroArticle && (
              <Link
                href={`/news/${heroArticle.slug}`}
                className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-[var(--border)] bg-black min-h-[350px] sm:min-h-[420px] lg:min-h-[480px] hover:border-[var(--accent-color)] shadow-sm hover:shadow-md transition-all duration-500"
              >
                {/* Background Image */}
                <Image
                  src={heroArticle.imageSrc}
                  alt={heroArticle.title[locale]}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover opacity-85 transition-transform duration-[1200ms] group-hover:scale-[1.03]"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

                {/* Content Overlay */}
                <div className="relative z-20 p-5 sm:p-8 md:p-10 max-w-full">
                  {/* Category tag */}
                  <span className="inline-block rounded-md bg-[var(--primary-color)] px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white mb-3">
                    {heroArticle.category[locale]}
                  </span>

                  {/* Title */}
                  <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug">
                    {heroArticle.title[locale]}
                  </h2>

                  {/* Description */}
                  <p className="mt-3 font-[family-name:var(--font-lora)] text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-2 max-w-2xl">
                    {heroArticle.description[locale]}
                  </p>

                  {/* Meta details */}
                  <div className="mt-5 flex items-center gap-4 text-[10px] sm:text-xs text-white/60 font-[family-name:var(--font-lora)]">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-white/80" />
                      {heroArticle.dateLong[locale]}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} className="text-white/80" />
                      {heroArticle.readTime[locale]}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Stacked Side Cards (Right) */}
            <div className="flex flex-col gap-6 justify-between">
              {sideArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="group flex flex-row items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] p-3 sm:p-4 hover:border-[var(--accent-color)] hover:shadow-xs transition-all duration-300 flex-1 min-h-[160px] sm:min-h-[190px]"
                >
                  {/* Left Small Image */}
                  <div className="relative w-1/3 aspect-[4/3] rounded-lg overflow-hidden shrink-0 bg-[var(--bg-secondary)]">
                    <Image
                      src={article.imageSrc}
                      alt={article.title[locale]}
                      fill
                      sizes="(max-width: 640px) 120px, 200px"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>

                  {/* Right Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-color)]">
                      {article.category[locale]}
                    </span>
                    <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-sm sm:text-base md:text-lg font-bold text-[var(--primary-color)] leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-[var(--accent-color)]">
                      {article.title[locale]}
                    </h3>
                    <p className="mt-1.5 hidden sm:line-clamp-2 font-[family-name:var(--font-lora)] text-[11px] sm:text-xs text-[var(--text-light)] leading-relaxed">
                      {article.description[locale]}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-[9px] sm:text-xs text-[var(--text-light)]/80 font-[family-name:var(--font-lora)]">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} className="text-[var(--primary-color)]" />
                        {article.dateShort[locale]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} className="text-[var(--primary-color)]" />
                        {article.readTime[locale]}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* If only Hero exists, render placeholders or stretch Hero */}
              {sideArticles.length === 0 && (
                <div className="hidden lg:flex flex-col gap-6 justify-center items-center border border-dashed border-[var(--border)] rounded-xl p-8 h-full bg-[var(--bg-secondary)]/10">
                  <span className="text-xs text-[var(--text-light)] font-medium">
                    {t('noArticles')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-secondary)]/10 mb-14">
          <p className="text-sm text-[var(--text-light)] font-medium">
            {t('noArticles')}
          </p>
        </div>
      )}

      {/* Main Grid List */}
      {displayedGridArticles.length > 0 && (
        <section className="mb-14">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedGridArticles.map((article) => (
              <NewsCard
                key={article.id}
                slug={article.slug}
                category={article.category[locale]}
                title={article.title[locale]}
                description={article.description[locale]}
                dateShort={article.dateShort[locale]}
                dateLong={article.dateLong[locale]}
                imageSrc={article.imageSrc}
                readTime={article.readTime[locale]}
                readMoreLabel={t('readMore')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pagination / Load More */}
      {gridArticles.length > 0 && (
        <section className="flex justify-center mt-6">
          {hasMore ? (
            <Button
              type="button"
              onClick={handleLoadMore}
              className="h-11 px-8 rounded-md border border-[var(--primary-color)] bg-transparent text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white transition-all duration-300 font-semibold text-xs tracking-wider uppercase shadow-none cursor-pointer"
            >
              {t('loadMore')}
            </Button>
          ) : (
            <span className="text-xs font-semibold tracking-wider text-[var(--text-light)] uppercase border-t border-[var(--border)] pt-4 w-full text-center">
              {t('allLoaded')}
            </span>
          )}
        </section>
      )}
    </Container>
  );
}
