'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { FilterGroups, type FilterGroupsProps } from './FilterSidebar';

interface ProductMobileFilterSheetProps extends FilterGroupsProps {
  activeFilterCount: number;
  onClearAll: () => void;
  /** Số sản phẩm khớp bộ lọc hiện tại — hiện trên nút "Xem kết quả" */
  resultCount: number;
}

/**
 * Lọc trên mobile / tablet: nút "Lọc" nằm cạnh ô tìm kiếm trong thanh ghim, mở sheet trượt từ đáy.
 * Dùng lại đúng các nhóm lọc của cột desktop; chân sheet cố định với "Xóa tất cả" và "Xem N sản phẩm".
 */
export function ProductMobileFilterSheet({ activeFilterCount, onClearAll, resultCount, ...groupProps }: ProductMobileFilterSheetProps) {
  const t = useTranslations('ProductsPage.filter');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Drawer direction="bottom" open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground={false}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="relative flex h-10 shrink-0 cursor-pointer items-center gap-2 border border-[var(--text-main)]/80 px-3.5 text-xs font-semibold uppercase tracking-[1.5px] text-[var(--text-main)] transition-colors active:bg-[var(--bg-secondary)] lg:hidden"
        >
          <SlidersHorizontal size={15} strokeWidth={1.6} />
          {t('title')}
          {activeFilterCount > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-[var(--primary-color)] text-[10px] font-semibold tracking-normal text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </DrawerTrigger>

      <DrawerContent direction="bottom" className="max-h-[85vh] rounded-none font-[family-name:var(--font-lora)] lg:hidden">
        {/* Thanh kéo — vuốt xuống để đóng */}
        <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[var(--border)]" />

        <div className="flex items-center justify-between gap-4 border-b border-[var(--text-main)]/80 px-5 pb-3 pt-3">
          <div>
            <DrawerTitle className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--text-main)] [font-family:inherit]">
              {t('title')}
            </DrawerTitle>
            <DrawerDescription className="sr-only">{t('sheetDescription')}</DrawerDescription>
          </div>
          <DrawerCloseButton className="size-9 rounded-none" />
        </div>

        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
          <FilterGroups {...groupProps} />
        </div>

        <div className="grid grid-cols-[auto_1fr] items-center gap-4 border-t border-[var(--border)] bg-[var(--bg-main)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClearAll}
            disabled={activeFilterCount === 0}
            className="cursor-pointer text-xs font-semibold uppercase tracking-[1.5px] text-[var(--text-main)] underline-offset-4 transition-colors hover:text-[var(--primary-color)] hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline"
          >
            {t('clearAllShort')}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="min-h-12 cursor-pointer bg-[var(--primary-color)] px-5 text-xs font-semibold uppercase tracking-[2px] text-white transition-colors active:bg-[#2A0A12]"
          >
            {t('showResults', { count: resultCount })}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
