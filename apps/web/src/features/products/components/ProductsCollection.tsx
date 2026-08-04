'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { ProductMobileFilterDock } from './ProductMobileFilterDock';
import { FilterSidebar } from './FilterSidebar';
import { useProducts } from '../hooks/useProducts';
import { productCatalog, type GridSize, type SortKey } from '../types/products.types';

const sortKeys: SortKey[] = ['all', 'newest', 'priceAsc', 'priceDesc', 'bestSeller', 'favorite'];

const gridClassName: Record<GridSize, string> = {
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-3 xl:grid-cols-4',
  5: 'lg:grid-cols-4 xl:grid-cols-5',
};

interface ProductsCollectionProps {
  initialCategory?: string;
}

export function ProductsCollection({ initialCategory }: ProductsCollectionProps) {
  const t = useTranslations('ProductsPage');
  const tc = useTranslations('Common');
  
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
    currentPage,
    productListTopRef,
    filteredProducts,
    visibleProducts,
    pageCount,
    safePage,
    resetPageAndScroll,
    setPageAndScroll,
    toggleValue,
  } = useProducts(initialCategory);

  const renderPaginationItems = () => {
    const items = [];

    // Luôn hiển thị trang đầu
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => setPageAndScroll(1)}
          isActive={safePage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Nếu trang hiện tại lớn hơn 3, hiển thị Ellipsis trước
    if (safePage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Các trang ở giữa
    const startPage = Math.max(2, safePage - 1);
    const endPage = Math.min(pageCount - 1, safePage + 1);

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setPageAndScroll(i)}
            isActive={safePage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Nếu trang hiện tại cách trang cuối lớn hơn 2, hiển thị Ellipsis sau
    if (safePage < pageCount - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Luôn hiển thị trang cuối (nếu pageCount > 1)
    if (pageCount > 1) {
      items.push(
        <PaginationItem key={pageCount}>
          <PaginationLink
            onClick={() => setPageAndScroll(pageCount)}
            isActive={safePage === pageCount}
          >
            {pageCount}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="mt-12 grid gap-10 sm:pb-28 lg:grid-cols-[280px_1fr] lg:pb-0">
      <FilterSidebar
        locale={locale}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
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
      />

      <ProductMobileFilterDock
        locale={locale}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
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
      />

      <div>
        <div
          ref={productListTopRef}
          className="scroll-mt-28 flex flex-row gap-4 pb-5 justify-between items-center sm:flex-row sm:border-b border-[var(--bg-secondary)] sm:mb-8"
        >
          <div className="text-sm text-[var(--text-light)]">
            <span className="hidden sm:inline">
              {t('collection.foundCount', { count: filteredProducts.length })}
            </span>
            <span className="inline sm:hidden font-medium">
              {t('collection.foundCountMobile', { count: filteredProducts.length })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-light)]">{t('collection.sortByLabel')}</span>
            <div className='min-w-[100px] cursor-pointer sm:min-w-[160px]'>
              <Select
                value={sortKey}
                onValueChange={(value) => {
                  if (value) {
                    setSortKey(value as SortKey);
                    resetPageAndScroll();
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full bg-white text-[var(--text-main)] hover:border-[var(--primary-color)] transition-colors">
                  <SelectValue placeholder={t('collection.sortByPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="w-56 bg-white text-[var(--text-main)] border border-[var(--bg-secondary)] shadow-md">
                  <SelectGroup>
                    <SelectLabel>{t('collection.sortByLabel')}</SelectLabel>
                    {sortKeys.map((key) => (
                      <SelectItem key={key} value={key} className='cursor-pointer'>
                        {t(`collection.sortOptions.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* list data */}
        <div className={cn('grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 xl:gap-x-7', gridClassName[gridSize])}>
          {visibleProducts.map((product, index) => (
            <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 45}ms` }}>
              <ProductCard
                imageSrc={product.imageSrc}
                hoverImageSrc={product.hoverImageSrc}
                imageAlt={product.imageAlt}
                name={product.name[locale]}
                description={product.description[locale]}
                price={product.price[locale]}
                originalPrice={product.originalPrice?.[locale]}
                colorSwatches={product.colors}
                sizes={product.sizes}
                material={product.material}
                purchaseType={product.purchaseType}
                productHref={`/products/${product.id}`}
              />
            </div>
          ))}
        </div>

        {filteredProducts.length > 0 && (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:border-t sm:border-[var(--bg-secondary)] sm:mt-12 pt-6">
            {pageCount > 1 ? (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => safePage > 1 && setPageAndScroll(safePage - 1)}
                      text={tc('previous')}
                      className={cn(
                        safePage === 1 && "pointer-events-none opacity-40 cursor-not-allowed"
                      )}
                    />
                  </PaginationItem>

                  {renderPaginationItems()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => safePage < pageCount && setPageAndScroll(safePage + 1)}
                      text={tc('next')}
                      className={cn(
                        safePage === pageCount && "pointer-events-none opacity-40 cursor-not-allowed"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : (
              <div />
            )}

            {/* Grid column size controller */}
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-nowrap text-sm text-[var(--text-light)]">{t('collection.columnsLabel')}</span>
              <div className="w-[100px] cursor-pointer">
                <Select
                  value={String(gridSize)}
                  onValueChange={(value) => {
                    if (value) {
                      setGridSize(Number(value) as GridSize);
                      resetPageAndScroll();
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-full bg-white text-[var(--text-main)] hover:border-[var(--primary-color)] transition-colors text-xs font-semibold">
                    <SelectValue placeholder={t('collection.columnsPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="w-28 bg-white text-[var(--text-main)] border border-[var(--bg-secondary)] shadow-md text-xs">
                    <SelectGroup>
                      <SelectItem value="3" className="cursor-pointer text-xs">
                        {t('collection.cols3')}
                      </SelectItem>
                      <SelectItem value="4" className="cursor-pointer text-xs">
                        {t('collection.cols4')}
                      </SelectItem>
                      <SelectItem value="5" className="cursor-pointer text-xs">
                        {t('collection.cols5')}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
