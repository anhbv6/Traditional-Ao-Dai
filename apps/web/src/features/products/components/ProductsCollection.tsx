'use client';

import React from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ProductCard } from './ProductCard';
import { ProductMobileFilterSheet } from './ProductMobileFilterSheet';
import { ProductsToolbar } from './ProductsToolbar';
import { ProductListControls } from './ProductListControls';
import { ActionButton } from '@/components/shared/ActionButton';
import { ActiveFilters, FilterSidebar, categoryKeys, categoryOptions } from './FilterSidebar';
import { useProducts } from '../hooks/useProducts';
import { type GridSize, type ProductFilterParams } from '../types/products.types';
import { productCatalog } from '../data/mockProducts';
import { parseVndString } from '@/features/cart';


const gridClassName: Record<GridSize, string> = {
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-3 xl:grid-cols-4',
  5: 'lg:grid-cols-4 xl:grid-cols-5',
};

interface ProductsCollectionProps {
  /** Bộ lọc ban đầu từ URL (`?category=&type=&color=&material=&maxPrice=`) */
  filterParams?: ProductFilterParams;
  /** Từ khóa từ `?q=` */
  initialQuery?: string;
}

export function ProductsCollection({ filterParams, initialQuery }: ProductsCollectionProps) {
  const t = useTranslations('ProductsPage');
  const tc = useTranslations('Common');
  const tp = useTranslations('Product');

  const {
    locale,
    searchQuery,
    setSearchQuery,
    selectedCategories,
    setSelectedCategories,
    selectedCollections,
    setSelectedCollections,
    selectedPurchaseTypes,
    setSelectedPurchaseTypes,
    selectedColors,
    setSelectedColors,
    selectedMaterials,
    setSelectedMaterials,
    priceLimit,
    setPriceLimit,
    sortKey,
    setSortKey,
    gridSize,
    setGridSize,
    productListTopRef,
    filteredProducts,
    visibleProducts,
    pageCount,
    safePage,
    pageSize,
    resetPageAndScroll,
    setPageAndScroll,
    toggleValue,
    activeFilterCount,
    clearFilters,
  } = useProducts(filterParams, initialQuery);

  /** Thanh danh mục là chọn-một: bấm "Tất cả" bỏ lọc, bấm danh mục khác thay hẳn lựa chọn */
  const selectCategory = (category: string | null) => {
    setSelectedCategories(category ? [category] : []);
    resetPageAndScroll();
  };
  const categoryTabs = [
    { value: null, label: t('collection.allCategories'), count: productCatalog.length },
    ...categoryOptions
      .map((category) => ({
        value: category,
        label: tp(`categories.${categoryKeys[category]}`),
        count: productCatalog.filter((product) => product.category === category).length,
      }))
      // Danh mục chưa có sản phẩm thì ẩn — tránh tab bấm vào chỉ ra trang trống
      .filter((tab) => tab.count > 0),
  ];

  const renderPaginationItems = () => {
    const pages: (number | 'start' | 'end')[] = [1];
    if (safePage > 3) pages.push('start');
    for (let i = Math.max(2, safePage - 1); i <= Math.min(pageCount - 1, safePage + 1); i++) pages.push(i);
    if (safePage < pageCount - 2) pages.push('end');
    if (pageCount > 1) pages.push(pageCount);

    return pages.map((page) =>
      typeof page === 'number' ? (
        <PaginationItem key={page}>
          <PaginationLink
            onClick={() => setPageAndScroll(page)}
            isActive={safePage === page}
            className={cn(
              'cursor-pointer rounded-none border-0 bg-transparent font-[family-name:var(--font-playfair)] text-[15px]',
              safePage === page
                ? 'bg-transparent text-[var(--primary-ink)] shadow-[inset_0_-1px_0_var(--primary-color)] hover:bg-transparent'
                : 'text-[var(--text-light)] hover:bg-transparent hover:text-[var(--primary-ink)]'
            )}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      ) : (
        <PaginationItem key={`ellipsis-${page}`}>
          <PaginationEllipsis />
        </PaginationItem>
      )
    );
  };

  // Props bộ lọc dùng chung cho cột lọc desktop, sheet lọc mobile và chip ở trạng thái rỗng
  const filterProps = {
    locale,
    selectedCollections,
    setSelectedCollections,
    selectedPurchaseTypes,
    setSelectedPurchaseTypes,
    selectedColors,
    setSelectedColors,
    selectedMaterials,
    setSelectedMaterials,
    priceLimit,
    setPriceLimit,
    onFilterChange: resetPageAndScroll,
    productCatalog,
    toggleValue,
  };
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    resetPageAndScroll();
  };

  const listControls = (
    <ProductListControls
      sortKey={sortKey}
      onSortChange={(key) => {
        setSortKey(key);
        resetPageAndScroll();
      }}
      gridSize={gridSize}
      onGridSizeChange={(size) => {
        setGridSize(size);
        resetPageAndScroll();
      }}
    />
  );

  // "1–16 / 72 sản phẩm": biết ngay đang xem tới đâu khi có nhiều trang
  const totalCount = filteredProducts.length;
  const rangeFrom = (safePage - 1) * pageSize + 1;
  const rangeTo = Math.min(safePage * pageSize, totalCount);

  return (
    <div className="mt-8 grid gap-10 sm:mt-14 lg:grid-cols-[260px_1fr] lg:gap-12 xl:gap-14">
      <FilterSidebar
        {...filterProps}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        activeFilterCount={activeFilterCount}
        onClearAll={clearFilters}
      />

      <div className="min-w-0">
        {/* Mốc cuộn khi đổi bộ lọc / phân trang, và đích của liên kết `#product-list` từ banner sự kiện */}
        <div id="product-list" ref={productListTopRef} className="scroll-mt-20" />
        <ProductsToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          tabs={categoryTabs}
          isTabActive={(value) =>
            value === null ? selectedCategories.length === 0 : selectedCategories.length === 1 && selectedCategories[0] === value
          }
          onSelectTab={selectCategory}
          endSlot={listControls}
          filterSlot={
            <ProductMobileFilterSheet
              {...filterProps}
              activeFilterCount={activeFilterCount}
              onClearAll={clearFilters}
              resultCount={totalCount}
            />
          }
        />

        {/* Hàng kết quả: số lượng (mọi màn hình) + sắp xếp (mobile — desktop đã nằm trong thanh ghim) */}
        <div className="flex min-h-14 items-center justify-between gap-4 py-3 lg:min-h-0 lg:py-4">
          <p className="text-sm text-[var(--text-light)]">
            {totalCount > pageSize
              ? t('collection.showingRange', { from: rangeFrom, to: rangeTo, total: totalCount })
              : t('collection.foundCount', { count: totalCount })}
          </p>
          <div className="lg:hidden">{listControls}</div>
        </div>

        {visibleProducts.length > 0 ? (
          // Đổi bộ lọc / sắp xếp / số cột: thẻ cũ mờ đi, thẻ còn lại trượt mượt về vị trí mới (layout), thẻ mới hiện lần lượt
          <MotionConfig reducedMotion="user">
          <motion.div layout className={cn('grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-6 sm:gap-y-12', gridClassName[gridSize])}>
            <AnimatePresence mode="popLayout" initial={false}>
            {visibleProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
                transition={{
                  layout: { type: 'spring', stiffness: 260, damping: 32 },
                  opacity: { duration: 0.6, delay: Math.min(index, 11) * 0.04 },
                  y: { duration: 0.8, delay: Math.min(index, 11) * 0.04, ease: [0.22, 1, 0.36, 1] },
                }}
              >
                <ProductCard
                  imageSrc={product.imageSrc}
                  hoverImageSrc={product.hoverImageSrc}
                  imageAlt={product.imageAlt}
                  name={product.name[locale]}
                  description={product.description[locale]}
                  price={product.price[locale]}
                  priceValue={parseVndString(product.price.vi)}
                  slug={product.id}
                  originalPrice={product.originalPrice?.[locale]}
                  originalPriceValue={product.originalPrice ? parseVndString(product.originalPrice.vi) : undefined}
                  colorSwatches={product.colors}
                  sizes={product.sizes}
                  material={product.material}
                  purchaseType={product.purchaseType}
                  productHref={`/products/${product.id}`}
                />
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
          </MotionConfig>
        ) : (
          <div className="border-y border-[var(--border)] py-20 text-center">
            <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--text-main)]">{t('collection.emptyTitle')}</p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--text-light)]">{t('collection.emptyDescription')}</p>
            {/* Bỏ từng bộ lọc đang chặn kết quả, hoặc xóa hết một lần */}
            <div className="mx-auto mt-6 max-w-md [&_ul]:justify-center">
              <ActiveFilters {...filterProps} searchQuery={searchQuery} onSearchChange={handleSearchChange} />
            </div>
            <ActionButton variant="confirm" size="md" onClick={clearFilters} className="mt-8">
              {t('collection.clearFilters')}
            </ActionButton>
          </div>
        )}

        {pageCount > 1 ? (
          <Pagination className="mt-12 border-t border-[var(--border)] pt-6 sm:mt-16 sm:pt-8">
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => safePage > 1 && setPageAndScroll(safePage - 1)}
                  text={tc('previous')}
                  className={cn(
                    'cursor-pointer rounded-none border-0 bg-transparent text-[var(--text-main)] hover:bg-transparent hover:text-[var(--primary-ink)]',
                    safePage === 1 && 'pointer-events-none opacity-40'
                  )}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => safePage < pageCount && setPageAndScroll(safePage + 1)}
                  text={tc('next')}
                  className={cn(
                    'cursor-pointer rounded-none border-0 bg-transparent text-[var(--text-main)] hover:bg-transparent hover:text-[var(--primary-ink)]',
                    safePage === pageCount && 'pointer-events-none opacity-40'
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </div>
  );
}
