'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { getAuthor, type MockArticle } from '../types/news.types';

const FALLBACK_IMAGE = '/logo.png';

/** Ảnh phóng rất chậm khi rê chuột — đồng bộ với trang chủ / Câu chuyện */
const IMAGE_HOVER = 'transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]';
/** Khung viền mảnh hiện trong ảnh khi rê chuột */
const HOVER_FRAME = 'pointer-events-none absolute inset-3 border border-white/0 transition-colors duration-700 group-hover:border-white/60';
const TITLE_HOVER = 'decoration-[var(--accent-color)] decoration-1 underline-offset-4 group-hover:underline';
const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-color)]';

/**
 * - `card`: thẻ tạp chí có viền — ảnh 4:3, danh mục, tiêu đề, mô tả, ngày + "đọc tiếp" (slider trang chủ)
 * - `featured`: bài nổi bật đầu trang tin — ảnh rộng 21:9, tiêu đề lớn
 * - `overlay`: chữ đè lên ảnh, nền đỏ thẫm mờ dần (khối tin mới nhất)
 * - `horizontal`: chữ bên trái, ảnh dọc nhỏ bên phải
 * - `portrait`: ảnh 3:4 trên, tiêu đề dưới (lưới xu hướng)
 * - `compact`: ảnh nhỏ bên trái + tiêu đề gọn (sidebar bài liên quan, cẩm nang)
 */
export type NewsCardVariant = 'card' | 'featured' | 'overlay' | 'horizontal' | 'portrait' | 'compact';

export interface NewsCardProps {
  article: MockArticle;
  locale: 'vi' | 'en';
  variant?: NewsCardVariant;
  /** Nhãn liên kết cuối thẻ ("Đọc tiếp") — dùng cho `card`, `featured` */
  actionLabel?: string;
  /** Nhãn góc ảnh ("Nổi bật") — dùng cho `featured` */
  badge?: string;
  /** Hiện mô tả ngắn ở `compact` */
  showDescription?: boolean;
  /** Ảnh nằm ở màn hình đầu (LCP) → tải ngay */
  priority?: boolean;
  className?: string;
}

/** Dòng thông tin phụ: các mục cách nhau bằng hình thoi nhỏ */
function MetaLine({ items, className }: { items: string[]; className?: string }) {
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-[1.8px]', className)}>
      {items.map((item, i) => (
        <React.Fragment key={`${item}-${i}`}>
          {i > 0 ? <span aria-hidden="true" className="size-1 rotate-45 bg-[var(--accent-color)]" /> : null}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </p>
  );
}

interface CoverProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  frame?: boolean;
}

/** Ảnh bìa: link chết → logo trên nền be thay vì ô trống có chữ alt */
function Cover({ src, alt, sizes, priority, className, frame = true }: CoverProps) {
  const [hasError, setHasError] = useState(false);
  return (
    <div className={cn('relative overflow-hidden bg-[var(--bg-secondary)]', className)}>
      <Image
        src={hasError ? FALLBACK_IMAGE : src}
        alt={alt}
        fill
        sizes={sizes}
        loading={priority ? 'eager' : undefined}
        fetchPriority={priority ? 'high' : undefined}
        onError={() => setHasError(true)}
        className={cn(IMAGE_HOVER, hasError ? 'object-contain p-6' : 'object-cover')}
      />
      {frame ? <div aria-hidden="true" className={HOVER_FRAME} /> : null}
    </div>
  );
}

function ReadMore({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold uppercase tracking-[1.5px] text-[var(--primary-ink)]', className)}>
      {label}
      <ArrowRight size={14} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
    </span>
  );
}

/**
 * Thẻ tin tức DÙNG CHUNG cho mọi nơi hiển thị bài viết (trang chủ, trang Tin tức, sidebar bài liên quan).
 * Cả thẻ là một liên kết tới `/news/<slug>`; nội dung lấy theo locale (thiếu bản dịch thì dùng tiếng Việt).
 */
export function NewsCard({
  article,
  locale,
  variant = 'card',
  actionLabel,
  badge,
  showDescription = false,
  priority,
  className,
}: NewsCardProps) {
  const pick = (value: { vi: string; en: string }) => value[locale] || value.vi;
  const title = pick(article.title);
  const href = `/news/${article.slug}`;

  if (variant === 'featured') {
    return (
      <Link href={href} className={cn('group block', FOCUS_RING, className)}>
        <div className="relative">
          <Cover src={article.imageSrc} alt={title} sizes="100vw" priority={priority} className="aspect-[4/3] w-full sm:aspect-[16/10] md:aspect-[21/9]" />
          {badge ? (
            <span className="absolute left-3 top-3 bg-[var(--bg-card)]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[2px] text-[var(--primary-ink)] sm:left-5 sm:top-5 sm:px-3 sm:py-1.5">
              {badge}
            </span>
          ) : null}
        </div>
        <div className="mt-5 grid gap-4 sm:mt-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
          <div>
            <MetaLine
              className="text-[var(--text-light)]"
              items={[pick(article.category), getAuthor(article.id), pick(article.dateLong), pick(article.readTime)]}
            />
            <h2 className={cn('mt-3 max-w-4xl font-[family-name:var(--font-playfair)] text-xl font-semibold leading-tight text-[var(--primary-ink)] underline-offset-[6px] sm:text-3xl lg:text-[2.5rem]', TITLE_HOVER)}>
              {title}
            </h2>
          </div>
          {actionLabel ? (
            <ReadMore
              label={actionLabel}
              className="w-fit shrink-0 gap-3 border-b border-[var(--primary-color)]/40 pb-1 text-xs tracking-[2px] transition-colors group-hover:border-[var(--primary-color)]"
            />
          ) : null}
        </div>
      </Link>
    );
  }

  if (variant === 'overlay') {
    return (
      <Link href={href} className={cn('group relative flex min-h-[300px] flex-col justify-end overflow-hidden sm:min-h-[420px]', FOCUS_RING, className)}>
        <Cover src={article.imageSrc} alt={title} sizes="(max-width: 1024px) 100vw, 640px" frame={false} className="absolute inset-0" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-(--bg-wine)/90 via-(--bg-wine)/30 to-transparent" />
        <div aria-hidden="true" className={HOVER_FRAME} />
        <div className="relative p-5 sm:p-8">
          <MetaLine className="text-white/75" items={[pick(article.category), pick(article.dateLong)]} />
          <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-lg font-semibold leading-snug text-white sm:text-2xl">{title}</h3>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link href={href} className={cn('group flex items-center gap-4 sm:gap-5', FOCUS_RING, className)}>
        <div className="min-w-0 flex-1">
          <MetaLine className="text-[var(--accent-color)]" items={[pick(article.category), pick(article.dateShort)]} />
          <h3 className={cn('mt-2 line-clamp-2 font-[family-name:var(--font-playfair)] text-base font-semibold leading-snug text-[var(--primary-ink)] sm:text-lg', TITLE_HOVER)}>
            {title}
          </h3>
          <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-[var(--text-light)] sm:text-sm">{pick(article.description)}</p>
        </div>
        <Cover src={article.imageSrc} alt={title} sizes="130px" frame={false} className="aspect-[4/5] w-20 shrink-0 sm:w-32" />
      </Link>
    );
  }

  if (variant === 'portrait') {
    return (
      <Link href={href} className={cn('group block', FOCUS_RING, className)}>
        <Cover src={article.imageSrc} alt={title} sizes="(max-width: 1024px) 50vw, 320px" className="aspect-[3/4]" />
        <MetaLine className="mt-3 text-[10px] text-[var(--text-light)] sm:mt-4 sm:text-[11px]" items={[getAuthor(article.id), pick(article.dateShort)]} />
        <h3 className={cn('mt-2 line-clamp-2 font-[family-name:var(--font-playfair)] text-[15px] font-semibold leading-snug text-[var(--primary-ink)] sm:text-lg', TITLE_HOVER)}>
          {title}
        </h3>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={href} className={cn('group flex items-start gap-3.5 sm:gap-4', FOCUS_RING, className)}>
        <Cover src={article.imageSrc} alt="" sizes="100px" frame={false} className="aspect-[4/3] w-20 shrink-0 sm:w-24" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[var(--primary-ink)]">{pick(article.category)}</p>
          <h3 className={cn('mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-main)] transition-colors group-hover:text-[var(--primary-ink)]')}>
            {title}
          </h3>
          {showDescription ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--text-light)] sm:text-sm sm:leading-6">{pick(article.description)}</p>
          ) : null}
          <p className="mt-1.5 text-[11px] text-[var(--text-light)]">
            {pick(article.dateShort)} · {pick(article.readTime)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'group flex h-full flex-col border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-500 hover:border-[var(--primary-color)]/40',
        FOCUS_RING,
        className
      )}
    >
      <article className="flex h-full flex-col">
        <Cover src={article.imageSrc} alt={title} sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 420px" className="aspect-[4/3]" />

        <div className="flex flex-1 flex-col p-4 sm:p-5 lg:p-6">
          <MetaLine className="font-semibold tracking-[2px] text-[var(--accent-color)]" items={[pick(article.category), pick(article.readTime)]} />

          <h3 className="mt-3 line-clamp-2 min-h-[2.6em] font-[family-name:var(--font-playfair)] text-base font-semibold leading-[1.3] text-[var(--primary-ink)] sm:text-lg xl:text-xl">
            {title}
          </h3>

          <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-6 text-[var(--text-light)] sm:mt-3 sm:text-sm sm:leading-7">{pick(article.description)}</p>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs sm:mt-5 sm:pt-4">
            <time className="text-[var(--text-light)]">
              <span className="sm:hidden">{pick(article.dateShort)}</span>
              <span className="hidden sm:inline">{pick(article.dateLong)}</span>
            </time>
            {actionLabel ? <ReadMore label={actionLabel} /> : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
