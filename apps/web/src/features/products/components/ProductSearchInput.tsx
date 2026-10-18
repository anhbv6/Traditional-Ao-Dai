'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ProductSearchInputProps {
  value: string;
  onChange: (query: string) => void;
  className?: string;
}

/**
 * Ô tìm kiếm sản phẩm — dùng chung cho đầu cột lọc (desktop) và thanh ghim (mobile).
 * Phím "/" đưa con trỏ vào ô đang hiển thị (bỏ qua ô bị ẩn theo breakpoint).
 */
export function ProductSearchInput({ value, onChange, className }: ProductSearchInputProps) {
  const t = useTranslations('ProductsPage.filter');
  const inputRef = useRef<HTMLInputElement>(null);

  // Lắng nghe phím tắt (đăng ký sự kiện, không đồng bộ state)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const input = inputRef.current;
      if (event.key !== '/' || isTyping || !input || input.offsetParent === null) return;
      event.preventDefault();
      input.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <label className={cn('group relative block min-w-0', className)}>
      <span className="sr-only">{t('searchTitle')}</span>
      <Search
        size={16}
        strokeWidth={1.6}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-light)] transition-colors group-focus-within:text-[var(--primary-ink)]"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('searchPlaceholder')}
        className="h-10 w-full border border-[var(--border)] bg-[var(--bg-card)] pl-9 pr-9 text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-light)]/60 hover:border-[var(--text-light)]/50 focus:border-[var(--primary-color)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label={t('clearSearch')}
          className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)]"
        >
          <X size={14} strokeWidth={1.8} />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 border border-[var(--border)] px-1.5 font-sans text-[10px] text-[var(--text-light)] lg:block">
          /
        </kbd>
      )}
    </label>
  );
}
