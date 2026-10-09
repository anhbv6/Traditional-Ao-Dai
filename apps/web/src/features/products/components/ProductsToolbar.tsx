'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface CategoryTab {
  value: string | null;
  label: string;
  count: number;
}

interface ProductsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  tabs: CategoryTab[];
  isTabActive: (value: string | null) => boolean;
  onSelectTab: (value: string | null) => void;
  /** Nút mở bộ lọc (chỉ mobile / tablet) đặt cạnh ô tìm kiếm */
  filterSlot?: ReactNode;
}

/**
 * Thanh tìm kiếm + danh mục được ghim ngay dưới header khi cuộn (sticky), nền mờ trong suốt
 * để vẫn thấy sản phẩm trôi phía sau. Phím "/" đưa con trỏ vào ô tìm kiếm (desktop).
 */
export function ProductsToolbar({ searchQuery, onSearchChange, tabs, isTabActive, onSelectTab, filterSlot }: ProductsToolbarProps) {
  const t = useTranslations('ProductsPage');
  const inputRef = useRef<HTMLInputElement>(null);

  // Lắng nghe phím tắt (đăng ký sự kiện, không đồng bộ state)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="sticky top-20 z-30 -mx-5 border-b border-[var(--border)] bg-[var(--bg-main)]/92 px-5 backdrop-blur-md sm:-mx-8 sm:px-8 lg:mx-0 lg:border-[var(--text-main)]/80 lg:px-0">
      <div className="flex flex-col-reverse gap-x-8 lg:flex-row lg:items-end">
        {/* Danh mục: cuộn ngang trên mobile; vạch chân trượt sang mục được chọn */}
        <nav aria-label={t('filter.categoryTitle')} className="-mx-5 min-w-0 flex-1 overflow-x-auto px-5 [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-32px),transparent)] [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 lg:[mask-image:none]">
          <ul className="flex min-w-max gap-7">
            {tabs.map((tab) => {
              const isActive = isTabActive(tab.value);
              return (
                <li key={tab.label}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onSelectTab(tab.value)}
                    className={cn(
                      'relative flex cursor-pointer items-baseline gap-1.5 py-4 text-sm transition-colors duration-300',
                      isActive ? 'font-semibold text-[var(--primary-color)]' : 'text-[var(--text-light)] hover:text-[var(--text-main)]'
                    )}
                  >
                    {tab.label}
                    <span className="text-[11px] tabular-nums opacity-60">{tab.count}</span>
                    {isActive ? (
                      <motion.span
                        layoutId="product-category-underline"
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--primary-color)]"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-end gap-3 pt-3 lg:w-72 lg:py-3">
        <label className="group relative block min-w-0 flex-1">
          <span className="sr-only">{t('filter.searchTitle')}</span>
          <Search
            size={16}
            strokeWidth={1.6}
            className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-light)] transition-colors group-focus-within:text-[var(--primary-color)] "
          />
          <input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('filter.searchPlaceholder')}
            className="w-full border-0 border-b border-[var(--border)] bg-transparent h-10 py-2 pl-7 pr-8 text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-light)]/60 focus:border-[var(--primary-color)] [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                inputRef.current?.focus();
              }}
              aria-label={t('filter.clearSearch')}
              className="absolute right-0 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center text-[var(--text-light)] transition-colors hover:text-[var(--primary-color)]"
            >
              <X size={14} strokeWidth={1.8} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 border border-[var(--border)] px-1.5 font-sans text-[10px] text-[var(--text-light)] lg:block">
              /
            </kbd>
          )}
        </label>
        {filterSlot}
        </div>
      </div>
    </div>
  );
}
