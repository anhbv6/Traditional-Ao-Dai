'use client';

import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ProductSearchInput } from './ProductSearchInput';

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
  /** Điều khiển danh sách (sắp xếp, số cột) — chỉ desktop, nằm bên phải thanh danh mục */
  endSlot?: ReactNode;
}

/**
 * Thanh danh mục (+ tìm kiếm & nút Lọc trên mobile) được ghim ngay dưới header khi cuộn (sticky),
 * nền mờ trong suốt để vẫn thấy sản phẩm trôi phía sau.
 */
export function ProductsToolbar({ searchQuery, onSearchChange, tabs, isTabActive, onSelectTab, filterSlot, endSlot }: ProductsToolbarProps) {
  const t = useTranslations('ProductsPage');

  return (
    <div className="sticky top-20 z-30 -mx-5 border-b border-[var(--border)] bg-[var(--bg-main)]/92 px-5 backdrop-blur-md sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
      <div className="flex flex-col-reverse gap-x-8 lg:flex-row lg:items-center">
        {/* Danh mục: cuộn ngang trên mobile; vạch chân trượt sang mục được chọn */}
        <nav aria-label={t('filter.categoryTitle')} className="-mx-5 min-w-0 flex-1 overflow-x-auto px-5 [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-32px),transparent)] [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:pl-0 lg:pr-8 lg:[mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)]">
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
                      isActive ? 'font-semibold text-[var(--primary-ink)]' : 'text-[var(--text-light)] hover:text-[var(--text-main)]'
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

        {endSlot ? <div className="hidden shrink-0 lg:block">{endSlot}</div> : null}

        {/* Mobile / tablet: tìm kiếm + nút Lọc. Desktop: ô tìm kiếm nằm ở đầu cột lọc bên trái */}
        <div className="flex items-end gap-3 pt-3 lg:hidden">
        <ProductSearchInput value={searchQuery} onChange={onSearchChange} className="flex-1" />
        {filterSlot}
        </div>
      </div>
    </div>
  );
}
