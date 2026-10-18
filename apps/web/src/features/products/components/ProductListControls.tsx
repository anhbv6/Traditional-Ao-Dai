'use client';

import type { ComponentType } from 'react';
import { Columns3, Columns4, Grid3x3, type LucideProps } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { AppTooltip } from '@/components/shared/AppTooltip';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type GridSize, type SortKey } from '../types/products.types';

const sortKeys: SortKey[] = ['newest', 'bestSeller', 'favorite', 'priceAsc', 'priceDesc'];

/** Biểu tượng lưới cho từng số cột — nhìn là hiểu, không phải đoán ý nghĩa của số 3 / 4 / 5 */
const gridOptions: { size: GridSize; Icon: ComponentType<LucideProps> }[] = [
  { size: 3, Icon: Columns3 },
  { size: 4, Icon: Columns4 },
  { size: 5, Icon: Grid3x3 },
];

interface ProductListControlsProps {
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  gridSize: GridSize;
  onGridSizeChange: (size: GridSize) => void;
  className?: string;
}

/**
 * Sắp xếp + số cột lưới — desktop nằm trong thanh ghim (luôn trong tầm tay khi cuộn),
 * mobile nằm ở hàng kết quả bên dưới (chọn số cột chỉ có từ desktop).
 * Sắp xếp dạng chữ "Sắp xếp: Mới nhất ▾" nhẹ nhàng; vạch dọc ngăn với nhóm icon số cột.
 */
export function ProductListControls({ sortKey, onSortChange, gridSize, onGridSizeChange, className }: ProductListControlsProps) {
  const t = useTranslations('ProductsPage.collection');

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <Select
        value={sortKey}
        onValueChange={(value) => {
          if (value) onSortChange(value as SortKey);
        }}
      >
        <SelectTrigger
          aria-label={t('sortByLabel')}
          className="group/sort h-9 w-auto cursor-pointer gap-1.5 rounded-none border-0 bg-transparent px-0 text-sm shadow-none hover:bg-transparent focus-visible:ring-0 data-[popup-open]:bg-transparent"
        >
          <span className="text-[var(--text-light)]">{t('sortByLabel')}:</span>
          <SelectValue placeholder={t('sortByPlaceholder')} className="text-[var(--text-main)] transition-colors group-hover/sort:text-[var(--primary-ink)]">
            {(value: SortKey) => t(`sortOptions.${value}`)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="w-52 rounded-none border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-main)] shadow-md">
          <SelectGroup>
            {sortKeys.map((key) => (
              <SelectItem key={key} value={key} className="cursor-pointer rounded-none">
                {t(`sortOptions.${key}`)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Số cột lưới (chỉ desktop) */}
      <span aria-hidden="true" className="hidden h-4 w-px bg-[var(--border)] lg:block" />
      <div className="hidden items-center lg:flex" role="group" aria-label={t('columnsLabel')}>
        {gridOptions.map(({ size, Icon }) => {
          const isActive = gridSize === size;
          const label = t('columnsOption', { count: size });
          return (
            <AppTooltip key={size} content={label}>
              <button
                type="button"
                aria-pressed={isActive}
                aria-label={label}
                onClick={() => onGridSizeChange(size)}
                className={cn(
                  'grid size-8 cursor-pointer place-items-center transition-colors',
                  isActive ? 'text-[var(--primary-ink)]' : 'text-[var(--text-light)]/70 hover:text-[var(--text-main)]'
                )}
              >
                <Icon size={17} strokeWidth={isActive ? 1.9 : 1.5} />
              </button>
            </AppTooltip>
          );
        })}
      </div>
    </div>
  );
}
