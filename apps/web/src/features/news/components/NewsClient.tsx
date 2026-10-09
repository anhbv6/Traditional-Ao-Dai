'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/shared/Reveal';
import { SectionOrnament } from '@/components/shared/SectionOrnament';

import { useNews } from '../hooks/useNews';
import { categoryKeys, getAuthor } from '../types/news.types';

/** Hiệu ứng ảnh dùng chung: phóng rất chậm khi rê chuột — đồng bộ với trang chủ / Câu chuyện */
const IMAGE_HOVER = 'object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]';
/** Khung viền mảnh hiện trong ảnh khi rê chuột */
const HOVER_FRAME = 'pointer-events-none absolute inset-3 border border-white/0 transition-colors duration-700 group-hover:border-white/60';

/** Dòng thông tin phụ: các mục cách nhau bằng hình thoi nhỏ (thay cho dấu "—") */
function MetaLine({ items, className }: { items: string[]; className?: string }) {
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-[1.8px]', className)}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <span aria-hidden="true" className="size-1 rotate-45 bg-[var(--accent-color)]" /> : null}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </p>
  );
}

/** Tiêu đề mỗi khối: chữ Playfair thường (không viết hoa đậm), vạch kẻ dưới, link "xem tất cả" gạch chân */
function SectionTitle({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 border-b border-[var(--text-main)]/80 pb-3">
      <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--primary-color)] sm:text-[28px]">{title}</h2>
      <button
        type="button"
        onClick={onAction}
        className="group inline-flex shrink-0 cursor-pointer items-center gap-2 pb-1 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-light)] transition-colors hover:text-[var(--primary-color)]"
      >
        {actionLabel}
        <ArrowRight size={13} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
      </button>
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
      {/* Đầu trang: cùng kiểu tiêu đề căn giữa + hoạ tiết hình thoi như trang chủ */}
      <section className="mx-auto mb-10 mt-6 flex max-w-3xl flex-col items-center text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--primary-color)]">{t('eyebrow')}</p>
        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-[32px] font-semibold leading-tight text-[var(--primary-color)] sm:text-[44px]">
          {t('title')}
        </h1>
        <SectionOrnament className="mt-5" />
        <p className="mt-5 text-sm leading-7 text-[var(--text-light)] sm:text-base">{t('subtitle')}</p>
      </section>

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
                  isActive ? 'text-[var(--primary-color)]' : 'text-[var(--text-light)] hover:text-[var(--primary-color)]',
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
              <Link href={`/news/${heroArticle.slug}`} className="group block">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--bg-secondary)] md:aspect-[21/9]">
                  <Image
                    src={heroArticle.imageSrc}
                    alt={heroArticle.title[locale]}
                    fill
                    loading="eager"
                    fetchPriority="high"
                    sizes="100vw"
                    className={IMAGE_HOVER}
                  />
                  <div aria-hidden="true" className={HOVER_FRAME} />
                  <span className="absolute left-5 top-5 bg-white/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[2px] text-[var(--primary-color)]">
                    {t('featured')}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
                  <div>
                    <MetaLine
                      className="text-[var(--text-light)]"
                      items={[heroArticle.category[locale], getAuthor(heroArticle.id), heroArticle.dateLong[locale], heroArticle.readTime[locale]]}
                    />
                    <h2 className="mt-3 max-w-4xl font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--primary-color)] decoration-[var(--accent-color)] decoration-1 underline-offset-[6px] group-hover:underline sm:text-3xl lg:text-[40px]">
                      {heroArticle.title[locale]}
                    </h2>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-3 border-b border-[var(--primary-color)]/40 pb-1 text-xs font-semibold uppercase tracking-[2px] text-[var(--primary-color)] transition-colors group-hover:border-[var(--primary-color)]">
                    {t('readArticle')}
                    <ArrowRight size={15} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </section>
          )}

          {/* Tin mới nhất: 1 thẻ lớn chữ đè ảnh + 2 thẻ ngang */}
          {latestNewsArticles.length > 0 && (
            <Reveal className="mb-20">
              <SectionTitle title={t('sections.latestNews')} actionLabel={t('viewAll')} onAction={() => handleCategoryChange('all')} />

              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                {leftLatestArticle && (
                  <Link
                    href={`/news/${leftLatestArticle.slug}`}
                    className="group relative flex min-h-[360px] flex-col justify-end overflow-hidden sm:min-h-[420px]"
                  >
                    <Image
                      src={leftLatestArticle.imageSrc}
                      alt={leftLatestArticle.title[locale]}
                      fill
                      sizes="(max-width: 1024px) 100vw, 640px"
                      className={IMAGE_HOVER}
                    />
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#2A0A12]/90 via-[#2A0A12]/30 to-transparent" />
                    <div aria-hidden="true" className={HOVER_FRAME} />
                    <div className="relative p-6 sm:p-8">
                      <MetaLine className="text-white/75" items={[leftLatestArticle.category[locale], leftLatestArticle.dateLong[locale]]} />
                      <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug text-white sm:text-2xl">
                        {leftLatestArticle.title[locale]}
                      </h3>
                    </div>
                  </Link>
                )}

                <div className="flex flex-col divide-y divide-[var(--border)] border-y border-[var(--border)]">
                  {rightLatestArticles.map((article) => (
                    <Link key={article.id} href={`/news/${article.slug}`} className="group flex flex-1 items-center gap-5 py-6">
                      <div className="min-w-0 flex-1">
                        <MetaLine className="text-[var(--accent-color)]" items={[article.category[locale], article.dateShort[locale]]} />
                        <h3 className="mt-2 line-clamp-2 font-[family-name:var(--font-playfair)] text-lg font-semibold leading-snug text-[var(--primary-color)] decoration-[var(--accent-color)] decoration-1 underline-offset-4 group-hover:underline">
                          {article.title[locale]}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-light)]">{article.description[locale]}</p>
                      </div>
                      <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-[var(--bg-secondary)] sm:w-32">
                        <Image src={article.imageSrc} alt={article.title[locale]} fill sizes="130px" className={IMAGE_HOVER} />
                      </div>
                    </Link>
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
                  <Link key={article.id} href={`/news/${article.slug}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[var(--bg-secondary)]">
                      <Image
                        src={article.imageSrc}
                        alt={article.title[locale]}
                        fill
                        sizes="(max-width: 1024px) 50vw, 320px"
                        className={IMAGE_HOVER}
                      />
                      <div aria-hidden="true" className={HOVER_FRAME} />
                    </div>
                    <MetaLine className="mt-4 text-[var(--text-light)]" items={[getAuthor(article.id), article.dateShort[locale]]} />
                    <h3 className="mt-2 line-clamp-2 font-[family-name:var(--font-playfair)] text-base font-semibold leading-snug text-[var(--primary-color)] decoration-[var(--accent-color)] decoration-1 underline-offset-4 group-hover:underline sm:text-lg">
                      {article.title[locale]}
                    </h3>
                  </Link>
                ))}
              </div>
            </Reveal>
          )}

          {/* Cẩm nang & đời sống: danh sách gọn, ảnh vuông nhỏ */}
          {guidesArticles.length > 0 && (
            <Reveal className="mb-16">
              <SectionTitle title={t('sections.guidesLife')} actionLabel={t('viewAll')} onAction={() => handleCategoryChange('guide')} />

              <div className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-3">
                {guidesArticles.map((article) => (
                  <Link key={article.id} href={`/news/${article.slug}`} className="group flex items-start gap-4 border-b border-[var(--border)] py-6">
                    <div className="relative aspect-square w-20 shrink-0 overflow-hidden bg-[var(--bg-secondary)] sm:w-24">
                      <Image src={article.imageSrc} alt={article.title[locale]} fill sizes="100px" className={IMAGE_HOVER} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-[family-name:var(--font-playfair)] text-base font-semibold leading-snug text-[var(--primary-color)] decoration-[var(--accent-color)] decoration-1 underline-offset-4 group-hover:underline">
                        {article.title[locale]}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--text-light)] sm:text-sm sm:leading-6">{article.description[locale]}</p>
                      <MetaLine className="mt-2 text-[var(--text-light)]" items={[article.readTime[locale], getAuthor(article.id)]} />
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      ) : (
        <div className="mb-16 border border-[var(--border)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--text-light)]">{t('noArticles')}</p>
        </div>
      )}
    </div>
  );
}
