'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';

const FALLBACK_IMAGE = '/logoPage.png';

export interface NewsCardProps {
  slug: string;
  category: string;
  title: string;
  description: string;
  dateShort: string;
  dateLong: string;
  imageSrc: string;
  readTime: string;
  readMoreLabel: string;
}

/**
 * Thẻ bài viết phong cách tạp chí: góc vuông, viền mảnh, không đổ bóng.
 * Cả thẻ là một liên kết; tiêu đề hiển thị tối đa 2 dòng để không bị cắt cụt.
 */
export function NewsCard({
  slug,
  category,
  title,
  description,
  dateShort,
  dateLong,
  imageSrc,
  readTime,
  readMoreLabel,
}: NewsCardProps) {
  // Ảnh lỗi (link chết) -> hiện logo trên nền be thay vì ô trống có chữ alt
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <Link
      href={`/news/${slug}`}
      className="group flex h-full flex-col border border-[var(--border)] bg-white transition-colors duration-500 hover:border-[var(--primary-color)]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-color)]"
    >
      <article className="flex h-full flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)]">
          <Image
            src={hasImageError ? FALLBACK_IMAGE : imageSrc}
            alt={title}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 420px"
            onError={() => setHasImageError(true)}
            className={`transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] ${
              hasImageError ? 'object-contain p-10' : 'object-cover'
            }`}
          />
          {/* Khung viền mảnh hiện khi rê chuột — đồng bộ với khối Bộ sưu tập */}
          <div aria-hidden="true" className="absolute inset-3 border border-white/0 transition-colors duration-500 group-hover:border-white/60" />
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-7">
          <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--accent-color)]">
            <span className="text-[var(--primary-color)]">{category}</span>
            <span aria-hidden="true" className="size-1 rotate-45 bg-[var(--accent-color)]" />
            <span>{readTime}</span>
          </p>

          <h3 className="mt-3 line-clamp-2 min-h-[2.6em] font-[family-name:var(--font-playfair)] text-lg font-semibold leading-[1.3] text-[var(--primary-color)] sm:text-xl">
            {title}
          </h3>

          <p className="mt-3 line-clamp-2 flex-1 text-sm leading-7 text-[var(--text-light)]">{description}</p>

          <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs">
            <time className="text-[var(--text-light)]">
              <span className="sm:hidden">{dateShort}</span>
              <span className="hidden sm:inline">{dateLong}</span>
            </time>
            <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-[1.5px] text-[var(--primary-color)]">
              {readMoreLabel}
              <ArrowRight size={14} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
