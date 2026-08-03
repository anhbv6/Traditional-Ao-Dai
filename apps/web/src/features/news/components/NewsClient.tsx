'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { useNews } from '../hooks/useNews';
import { categoryKeys, getAuthor } from '../types/news.types';

export function NewsClient() {
  const t = useTranslations('NewsPage');
  const {
    selectedCategory,
    filteredArticles,
    heroArticle,
    latestNewsArticles,
    leftLatestArticle,
    rightLatestArticles,
    trendsArticles,
    guidesArticles,
    handleCategoryChange,
    locale,
  } = useNews();

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
      <section className="border-y border-[var(--border)] py-4 mb-10">
        <div className="flex w-full items-center justify-start md:justify-center gap-6 md:gap-10 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 md:px-0">
          {categoryKeys.map((key) => {
            const isActive = selectedCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleCategoryChange(key)}
                className={`cursor-pointer whitespace-nowrap text-sm font-semibold transition-colors duration-300 font-[family-name:var(--font-lora)] ${
                  isActive
                    ? 'text-[var(--primary-color)] font-bold'
                    : 'text-[var(--text-light)] hover:text-[var(--primary-color)]'
                }`}
              >
                {t(`categories.${key}`)}
              </button>
            );
          })}
        </div>
      </section>

      {filteredArticles.length > 0 ? (
        <>
          {/* Hero Section (Article 0) */}
          {heroArticle && (
            <section className="mb-14">
              {/* Large Cover Image */}
              <Link
                href={`/news/${heroArticle.slug}`}
                className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] relative aspect-[16/10] md:aspect-[21/9] w-full hover:border-[var(--accent-color)] transition-all duration-500 shadow-sm"
              >
                <Image
                  src={heroArticle.imageSrc}
                  alt={heroArticle.title[locale]}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.02]"
                />
              </Link>

              {/* Meta details row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-xs font-[family-name:var(--font-lora)] text-[var(--text-light)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--primary-color)]">
                    {heroArticle.category[locale]}
                  </span>
                  <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
                    {getAuthor(heroArticle.id)}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <span>{heroArticle.dateLong[locale]}</span>
                  <span>—</span>
                  <span>{heroArticle.readTime[locale]}</span>
                </div>
              </div>

              {/* Title & Link */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mt-3">
                <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--primary-color)] leading-tight max-w-4xl hover:text-[var(--accent-color)] transition-colors duration-300">
                  <Link href={`/news/${heroArticle.slug}`}>{heroArticle.title[locale]}</Link>
                </h2>
                <Link
                  href={`/news/${heroArticle.slug}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-sm text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors whitespace-nowrap group shrink-0 mt-1 md:mt-2"
                >
                  {t('readArticle')}
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </section>
          )}

          {/* Section 2: Latest News (Article 1, 2, 3) */}
          {latestNewsArticles.length > 0 && (
            <section className="mb-14">
              {/* Section Heading */}
              <div className="flex items-end justify-between border-b border-[var(--border)] pb-2 mb-6">
                <h2 className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wider text-[var(--primary-color)]">
                  {t('sections.latestNews')}
                </h2>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('all')}
                  className="text-xs font-bold text-[var(--text-light)] hover:text-[var(--primary-color)] transition-colors uppercase inline-flex items-center gap-1 cursor-pointer"
                >
                  {t('viewAll')}
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* Grid content */}
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Left Card: 1 Large overlay text card */}
                {leftLatestArticle && (
                  <Link
                    href={`/news/${leftLatestArticle.slug}`}
                    className="group relative flex flex-col justify-end overflow-hidden rounded-xl border border-[var(--border)] min-h-[350px] sm:min-h-[400px] hover:border-[var(--accent-color)] transition-all duration-500 shadow-sm"
                  >
                    <Image
                      src={leftLatestArticle.imageSrc}
                      alt={leftLatestArticle.title[locale]}
                      fill
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover transition-transform duration-[1000ms] group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent z-10" />

                    <div className="relative z-20 p-5 sm:p-8 max-w-full">
                      <h3 className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl lg:text-2xl font-bold text-white leading-snug">
                        {leftLatestArticle.title[locale]}
                      </h3>
                      <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-white/80 font-[family-name:var(--font-lora)]">
                        <span>{leftLatestArticle.category[locale]}</span>
                        <span>—</span>
                        <span>{leftLatestArticle.dateLong[locale]}</span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Right Stack: 2 vertical row cards */}
                <div className="flex flex-col gap-6 justify-between">
                  {rightLatestArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group flex flex-row gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] p-4 hover:border-[var(--accent-color)] transition-all duration-300 flex-1 min-h-[150px] items-center"
                    >
                      {/* Left Text */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-[family-name:var(--font-playfair)] text-sm sm:text-base md:text-lg font-bold text-[var(--primary-color)] leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-[var(--accent-color)]">
                          {article.title[locale]}
                        </h3>
                        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-light)] font-[family-name:var(--font-lora)]">
                          <span className="font-semibold text-[var(--accent-color)]">{article.category[locale]}</span>
                          <span>—</span>
                          <span>{article.dateShort[locale]}</span>
                        </div>
                      </div>

                      {/* Right Image */}
                      <div className="relative w-20 sm:w-36 aspect-[4/3] rounded-lg overflow-hidden shrink-0 bg-[var(--bg-secondary)] border border-[var(--border)]">
                        <Image
                          src={article.imageSrc}
                          alt={article.title[locale]}
                          fill
                          sizes="(max-width: 640px) 100px, 150px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    </Link>
                  ))}

                  {/* Empty state if rightLatestArticles is empty */}
                  {rightLatestArticles.length === 0 && (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-[var(--border)] rounded-xl p-8 bg-[var(--bg-secondary)]/10">
                      <span className="text-xs text-[var(--text-light)] font-medium">
                        {t('noArticles')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Section 3: Technology News (Trends / Articles 4, 5, 6, 7) */}
          {trendsArticles.length > 0 && (
            <section className="mb-14">
              {/* Section Heading */}
              <div className="flex items-end justify-between border-b border-[var(--border)] pb-2 mb-6">
                <h2 className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wider text-[var(--primary-color)]">
                  {t('sections.trendsStyle')}
                </h2>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('trends')}
                  className="text-xs font-bold text-[var(--text-light)] hover:text-[var(--primary-color)] transition-colors uppercase inline-flex items-center gap-1 cursor-pointer"
                >
                  {t('viewAll')}
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* Grid Layout (4 column cards) */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {trendsArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] group-hover:border-[var(--accent-color)] transition-all duration-300">
                      <Image
                        src={article.imageSrc}
                        alt={article.title[locale]}
                        fill
                        sizes="(max-width: 640px) 100vw, 300px"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="mt-2.5 flex items-center gap-2 text-[10px] sm:text-xs font-[family-name:var(--font-lora)] text-[var(--text-light)]/80">
                      <span>{getAuthor(article.id)}</span>
                      <span>—</span>
                      <span>{article.dateShort[locale]}</span>
                    </div>
                    <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-sm sm:text-base font-bold text-[var(--primary-color)] leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-[var(--accent-color)]">
                      {article.title[locale]}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Guides & Podcasts (Articles 8 to 13) */}
          {guidesArticles.length > 0 && (
            <section className="mb-14">
              {/* Section Heading */}
              <div className="flex items-end justify-between border-b border-[var(--border)] pb-2 mb-6">
                <h2 className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wider text-[var(--primary-color)]">
                  {t('sections.guidesLife')}
                </h2>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('guide')}
                  className="text-xs font-bold text-[var(--text-light)] hover:text-[var(--primary-color)] transition-colors uppercase inline-flex items-center gap-1 cursor-pointer"
                >
                  {t('viewAll')}
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* Grid layout (3 column horizontal cards) */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {guidesArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="group flex gap-4 items-start p-4 border border-[var(--border)] bg-[var(--bg-main)] rounded-lg hover:border-[var(--accent-color)] hover:shadow-xs transition-all duration-300 h-full"
                  >
                    {/* Left Square Image */}
                    <div className="relative w-20 sm:w-24 aspect-square rounded-md overflow-hidden shrink-0 bg-[var(--bg-secondary)] border border-[var(--border)]">
                      <Image
                        src={article.imageSrc}
                        alt={article.title[locale]}
                        fill
                        sizes="100px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                      <div>
                        <h3 className="font-[family-name:var(--font-playfair)] text-sm sm:text-base font-bold text-[var(--primary-color)] line-clamp-1 group-hover:text-[var(--accent-color)] transition-colors duration-300">
                          {article.title[locale]}
                        </h3>
                        <p className="mt-1 font-[family-name:var(--font-lora)] text-[11px] sm:text-xs text-[var(--text-light)] line-clamp-2 leading-relaxed">
                          {article.description[locale]}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2 text-[10px] sm:text-xs text-[var(--text-light)]/80 font-[family-name:var(--font-lora)]">
                        <span className="font-semibold">{article.readTime[locale]}</span>
                        <span>—</span>
                        <span>{getAuthor(article.id)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-secondary)]/10 mb-14">
          <p className="text-sm text-[var(--text-light)] font-medium">
            {t('noArticles')}
          </p>
        </div>
      )}
    </Container>
  );
}
