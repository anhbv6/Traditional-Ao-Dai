'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Một lựa chọn dạng chip bật/tắt — gọn hơn ô tích, tự xuống dòng theo bề rộng cột */
export function FilterChip({
  label,
  count,
  selected,
  onToggle,
  leading,
  className,
}: {
  label: string;
  count?: number;
  selected: boolean;
  onToggle: () => void;
  leading?: ReactNode;
  className?: string;
}) {
  const isEmpty = count === 0 && !selected;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      disabled={isEmpty}
      className={cn(
        'inline-flex min-h-8 cursor-pointer items-center gap-1.5 border px-2 text-xs transition-colors duration-200',
        selected
          ? 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white'
          : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--border)] disabled:hover:text-[var(--text-main)]',
        className
      )}
    >
      {leading}
      <span className="whitespace-nowrap">{label}</span>
      {count !== undefined ? (
        <span className={cn('text-[10px] tabular-nums', selected ? 'text-white/75' : 'text-[var(--text-light)]/70')}>{count}</span>
      ) : null}
    </button>
  );
}
