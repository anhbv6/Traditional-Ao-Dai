'use client';

import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

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
  return (
    <article className="cursor-pointer group flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-[color:var(--bg-secondary)] shadow-sm hover:shadow-md hover:border-[var(--accent-color)] transition-all duration-300">
      {/* Image Section */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)]">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute left-2 top-2 sm:left-4 sm:top-4 rounded bg-white/90 backdrop-blur-xs px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--primary-color)] shadow-xs">
          {category}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col pt-3 pb-3 px-3 sm:pt-6 sm:pb-6 sm:px-8">
        {/* Meta Info */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-4 text-[9px] sm:text-xs text-[var(--text-light)] font-[family-name:var(--font-lora)] mb-2 sm:mb-3">
          <span className="flex items-center gap-1">
            <Calendar size={10} className="text-[var(--primary-color)]" />
            <span className="sm:hidden">{dateShort}</span>
            <span className="hidden sm:inline">{dateLong}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} className="text-[var(--primary-color)]" />
            {readTime}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-[family-name:var(--font-playfair)] text-sm sm:text-lg md:text-xl font-bold text-[var(--primary-color)] leading-snug">
          <Link 
            href={`/news/${slug}`} 
            className="block truncate transition-opacity duration-300 hover:opacity-80 hover:no-underline focus:outline-hidden"
            title={title}
          >
            {title}
          </Link>
        </h3>

        {/* Description */}
        <p className="mt-1 sm:mt-3 font-[family-name:var(--font-lora)] text-[10px] sm:text-sm text-[var(--text-light)] leading-relaxed line-clamp-1 sm:line-clamp-2 flex-1">
          {description}
        </p>

        {/* Read More Link */}
        <div className="mt-2.5 sm:mt-5 pt-2.5 sm:pt-4 border-t border-[color:var(--bg-secondary)]">
          <Link
            href={`/news/${slug}`}
            className="inline-flex items-center gap-1.5 sm:gap-2 font-[family-name:var(--font-lora)] text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors duration-300"
          >
            {readMoreLabel}
            <ArrowRight size={10} className="sm:size-[14px] transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
