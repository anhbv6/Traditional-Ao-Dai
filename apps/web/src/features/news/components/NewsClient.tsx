'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/shared/Reveal';
import { PageIntro } from '@/components/shared/PageIntro';
import { SectionOrnament } from '@/components/shared/SectionOrnament';

import { useNews } from '../hooks/useNews';
import { categoryKeys } from '../types/news.types';
import { NewsCard } from './NewsCard';

/** Tiêu đề mỗi khối: chữ Playfair thường (không viết hoa đậm), hoạ tiết SectionOrnament bên dưới, link "xem tất cả" */
function SectionTitle({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between gap-4 pb-3">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--primary-ink)] sm:text-[1.75rem]">{title}</h2>
        <button
          type="button"
          onClick={onAction}
          className="group inline-flex shrink-0 cursor-pointer items-center gap-2 pb-1 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)]"
        >
          {actionLabel}
          <ArrowRight size={13} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
      <SectionOrnament fullWidth />
    </div>
  );
}

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
    <div>
      {/* Đầu trang: tiêu đề căn trái kiểu biên tập — đồng bộ Cửa hàng / Liên hệ */}
      <PageIntro eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} className="mb-12 sm:mb-16" />

      {/* Tab danh mục: vạch đỏ đô chạy ra dưới mục đang chọn */}
      <nav aria-label={t('eyebrow')} className="mb-12 border-y border-[var(--border)]">
        <div className="flex w-full items-center justify-start gap-2 overflow-x-auto px-1 [scrollbar-width:none] md:justify-center md:gap-4 [&::-webkit-scrollbar]:hidden">
          {categoryKeys.map((key) => {
            const isActive = selectedCategory === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleCategoryChange(key)}
                className={cn(
                  'relative cursor-pointer whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-[2px] transition-colors duration-300',
                  isActive ? 'text-[var(--primary-ink)]' : 'text-[var(--text-light)] hover:text-[var(--primary-ink)]',
                )}
              >
                {t(`categories.${key}`)}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-4 -bottom-px h-0.5 origin-center bg-[var(--primary-color)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    isActive ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {filteredArticles.length > 0 ? (
        // key theo danh mục -> đổi tab thì các khối hiện dần lại
        <div key={selectedCategory}>
          {/* Bài nổi bật — nằm ở màn hình đầu (ảnh LCP) nên không dùng hiệu ứng hiện dần */}
          {heroArticle && (
            <section className="mb-20">
              <NewsCard variant="featured" article={heroArticle} locale={locale} priority badge={t('featured')} actionLabel={t('readArticle')} />
            </section>
          )}

          {/* Tin mới nhất: 1 thẻ lớn chữ đè ảnh + 2 thẻ ngang */}
          {latestNewsArticles.length > 0 && (
            <Reveal className="mb-20">
              <SectionTitle title={t('sections.latestNews')} actionLabel={t('viewAll')} onAction={() => handleCategoryChange('all')} />

              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                {leftLatestArticle && <NewsCard variant="overlay" article={leftLatestArticle} locale={locale} />}

                <div className="flex flex-col divide-y divide-[var(--border)]">
                  {rightLatestArticles.map((article) => (
                    <NewsCard key={article.id} variant="horizontal" article={article} locale={locale} className="flex-1 py-5 sm:py-6" />
                  ))}

                  {rightLatestArticles.length === 0 && (
                    <div className="flex flex-1 items-center justify-center p-8">
                      <span className="text-sm text-[var(--text-light)]">{t('noArticles')}</span>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )}

          {/* Xu hướng & phong cách: lưới 4 cột ảnh dọc */}
          {trendsArticles.length > 0 && (
            <Reveal className="mb-20">
              <SectionTitle title={t('sections.trendsStyle')} actionLabel={t('viewAll')} onAction={() => handleCategoryChange('trends')} />

              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
                {trendsArticles.map((article) => (
                  <NewsCard key={article.id} variant="portrait" article={article} locale={locale} />
                ))}
              </div>
            </Reveal>
          )}

          {/* Cẩm nang & đời sống: danh sách gọn, ảnh vuông nhỏ */}
          {guidesArticles.length > 0 && (
            <Reveal className="mb-16">
              <SectionTitle title={t('sections.guidesLife')} actionLabel={t('viewAll')} onAction={() => handleCategoryChange('guide')} />

              {/* Chỉ kẻ vạch GIỮA các hàng: mỗi bài kẻ vạch trên, bỏ vạch ở hàng đầu theo số cột (1 → 2 → 3 cột) */}
              <div className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-3">
                {guidesArticles.map((article) => (
                  <NewsCard
                    key={article.id}
                    variant="compact"
                    article={article}
                    locale={locale}
                    showDescription
                    className="border-t border-[var(--border)] py-5 first:border-t-0 sm:py-6 md:nth-2:border-t-0 lg:nth-3:border-t-0"
                  />
                ))}
              </div>
            </Reveal>
          )}
        </div>
      ) : (
        <div className="mb-16 border border-[var(--border)] bg-[var(--bg-card)] py-16 text-center">
          <p className="text-sm text-[var(--text-light)]">{t('noArticles')}</p>
        </div>
      )}
    </div>
  );
}
