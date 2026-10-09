import React from 'react';
import { cn } from '@/lib/utils';
import { SectionOrnament } from '@/components/shared/SectionOrnament';

export interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** Số thứ tự chương ("01", "02"...) — tạo cảm giác câu chuyện có trình tự, kích thích cuộn tiếp */
  index?: string;
  align?: 'center' | 'left';
  /** Dùng trên nền tối (khối đỏ đô) */
  tone?: 'light' | 'dark';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  index,
  align = 'center',
  tone = 'light',
  className,
}: SectionHeadingProps) {
  const isDark = tone === 'dark';

  return (
    <div
      className={cn(
        'mb-10 flex max-w-3xl flex-col sm:mb-12',
        align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      <p
        className={cn(
          'flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[3px]',
          isDark ? 'text-[var(--accent-color)]' : 'text-[var(--primary-color)]',
        )}
      >
        {index ? <span className="font-[family-name:var(--font-playfair)] text-sm tracking-normal">{index}</span> : null}
        {index ? <span aria-hidden="true" className="h-px w-6 bg-current opacity-50" /> : null}
        {eyebrow}
      </p>
      <h2
        className={cn(
          'mt-3 font-[family-name:var(--font-playfair)] text-[30px] font-semibold leading-tight sm:text-[42px]',
          isDark ? 'text-white' : 'text-[var(--primary-color)]',
        )}
      >
        {title}
      </h2>
      <SectionOrnament className="mt-4" />
      {description ? (
        <p
          className={cn(
            'mt-4 max-w-2xl text-sm leading-7 sm:text-base',
            isDark ? 'text-white/75' : 'text-[var(--text-light)]',
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
