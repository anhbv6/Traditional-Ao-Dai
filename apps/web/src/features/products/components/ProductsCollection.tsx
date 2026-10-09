'use client';

import React from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { FilterSidebar, categoryKeys, categoryOptions } from './FilterSidebar';
import { useProducts } from '../hooks/useProducts';
import { type GridSize, type SortKey } from '../types/products.types';
import { productCatalog } from '../data/mockProducts';
import { parseVndString } from '@/features/cart';

const sortKeys: SortKey[] = ['newest', 'bestSeller', 'favorite', 'priceAsc', 'priceDesc'];
const gridSizes: GridSize[] = [3, 4, 5];

const gridClassName: Record<GridSize, string> = {
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-3 xl:grid-cols-4',
  5: 'lg:grid-cols-4 xl:grid-cols-5',
};

interface ProductsCollectionProps {
  initialCategory?: string;
  /** Từ khóa từ `?q=` */
  initialQuery?: string;
}

export function ProductsCollection({ initialCategory, initialQuery }: ProductsCollectionProps) {
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
    resetPageAndScroll,
    setPageAndScroll,
    toggleValue,
    activeFilterCount,
    clearFilters,
  } = useProducts(initialCategory, initialQuery);

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
                ? 'bg-transparent text-[var(--primary-color)] shadow-[inset_0_-1px_0_var(--primary-color)] hover:bg-transparent'
                : 'text-[var(--text-light)] hover:bg-transparent hover:text-[var(--primary-color)]'
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

  return (
    <div className="mt-8 grid gap-10 sm:mt-14 lg:grid-cols-[230px_1fr] lg:gap-14">
      <FilterSidebar
        locale={locale}
        selectedCollections={selectedCollections}
        setSelectedCollections={setSelectedCollections}
        selectedPurchaseTypes={selectedPurchaseTypes}
        setSelectedPurchaseTypes={setSelectedPurchaseTypes}
        selectedColors={selectedColors}
        setSelectedColors={setSelectedColors}
        selectedMaterials={selectedMaterials}
        setSelectedMaterials={setSelectedMaterials}
        priceLimit={priceLimit}
        setPriceLimit={setPriceLimit}
        onFilterChange={resetPageAndScroll}
        productCatalog={productCatalog}
        toggleValue={toggleValue}
        activeFilterCount={activeFilterCount}
        onClearAll={clearFilters}
      />

      <div className="min-w-0">
        {/* Mốc cuộn khi đổi bộ lọc / phân trang, và đích của liên kết `#product-list` từ banner sự kiện */}
        <div id="product-list" ref={productListTopRef} className="scroll-mt-20" />
        <ProductsToolbar
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            resetPageAndScroll();
          }}
          tabs={categoryTabs}
          isTabActive={(value) =>
            value === null ? selectedCategories.length === 0 : selectedCategories.length === 1 && selectedCategories[0] === value
          }
          onSelectTab={selectCategory}
          filterSlot={
            <ProductMobileFilterSheet
              locale={locale}
              selectedCollections={selectedCollections}
              setSelectedCollections={setSelectedCollections}
              selectedPurchaseTypes={selectedPurchaseTypes}
              setSelectedPurchaseTypes={setSelectedPurchaseTypes}
              selectedColors={selectedColors}
              setSelectedColors={setSelectedColors}
              selectedMaterials={selectedMaterials}
              setSelectedMaterials={setSelectedMaterials}
              priceLimit={priceLimit}
              setPriceLimit={setPriceLimit}
              onFilterChange={resetPageAndScroll}
              productCatalog={productCatalog}
              toggleValue={toggleValue}
              activeFilterCount={activeFilterCount}
              onClearAll={clearFilters}
              resultCount={filteredProducts.length}
            />
          }
        />

        <div>
          <div className="flex items-center justify-between gap-4 py-5">
            <p className="text-sm text-[var(--text-light)]">
              {t('collection.foundCount', { count: filteredProducts.length })}
            </p>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="hidden text-xs uppercase tracking-[2px] text-[var(--text-light)] sm:inline">{t('collection.sortByLabel')}</span>
                <Select
                  value={sortKey}
                  onValueChange={(value) => {
                    if (value) {
                      setSortKey(value as SortKey);
                      resetPageAndScroll();
                    }
                  }}
                >
                  <SelectTrigger className="h-9 min-w-[150px] cursor-pointer rounded-none border-0 border-b border-[var(--border)] bg-transparent px-0 text-sm text-[var(--text-main)] shadow-none hover:border-[var(--primary-color)] focus-visible:ring-0">
                    <SelectValue placeholder={t('collection.sortByPlaceholder')}>
                      {(value: SortKey) => t(`collection.sortOptions.${value}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-52 rounded-none border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-main)] shadow-md">
                    <SelectGroup>
                      {sortKeys.map((key) => (
                        <SelectItem key={key} value={key} className="cursor-pointer rounded-none">
                          {t(`collection.sortOptions.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Số cột lưới (chỉ desktop) */}
              <div className="hidden items-center gap-1 lg:flex" role="group" aria-label={t('collection.columnsLabel')}>
                <span className="mr-1 text-xs uppercase tracking-[2px] text-[var(--text-light)]">{t('collection.columnsLabel')}</span>
                {gridSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={gridSize === size}
                    onClick={() => {
                      setGridSize(size);
                      resetPageAndScroll();
                    }}
                    className={cn(
                      'grid size-7 cursor-pointer place-items-center text-sm tabular-nums transition-colors',
                      gridSize === size ? 'text-[var(--primary-color)] shadow-[inset_0_-1px_0_var(--primary-color)]' : 'text-[var(--text-light)] hover:text-[var(--text-main)]'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {visibleProducts.length > 0 ? (
          // Đổi bộ lọc / sắp xếp / số cột: thẻ cũ mờ đi, thẻ còn lại trượt mượt về vị trí mới (layout), thẻ mới hiện lần lượt
          <MotionConfig reducedMotion="user">
          <motion.div layout className={cn('grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12', gridClassName[gridSize])}>
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
            <button
              type="button"
              onClick={clearFilters}
              className="mt-8 inline-flex min-h-11 cursor-pointer items-center bg-[var(--primary-color)] px-7 text-xs font-semibold uppercase tracking-[2px] text-white transition-colors hover:bg-[#2A0A12]"
            >
              {t('collection.clearFilters')}
            </button>
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
                    'cursor-pointer rounded-none border-0 bg-transparent text-[var(--text-main)] hover:bg-transparent hover:text-[var(--primary-color)]',
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
                    'cursor-pointer rounded-none border-0 bg-transparent text-[var(--text-main)] hover:bg-transparent hover:text-[var(--primary-color)]',
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
