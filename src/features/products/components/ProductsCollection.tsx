'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, Grid2X2, Grid3X3, SlidersHorizontal } from 'lucide-react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import ProductCard from './ProductCard';
import { productCatalog } from '../data/mockProducts';

type Locale = 'vi' | 'en';
type GridSize = 3 | 4 | 5;
type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'bestSeller' | 'favorite';

const pageSize = 16;
const minPrice = 500000;
const maxPrice = 5000000;

const categoryOptions = ['Áo dài Cưới', 'Áo dài Cách tân', 'Áo dài Lễ/Tết', 'Áo dài Trẻ em', 'Phụ kiện'];
const purchaseOptions = [
  { id: 'ready', label: 'Hàng có sẵn' },
  { id: 'custom', label: 'Nhận may đo riêng' },
];
const colorOptions = [
  { name: 'Đỏ', hex: '#B32530' },
  { name: 'Vàng', hex: '#D8A928' },
  { name: 'Hồng', hex: '#E2A79E' },
  { name: 'Trắng', hex: '#F7F0E8' },
  { name: 'Lụa trơn', hex: '#C9B29B' },
  { name: 'Gấm thêu', hex: '#B77B3D' },
];
const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL', 'Free-size'];
const materialOptions = ['Lụa Tơ Tằm', 'Gấm', 'Tơ Nhung', 'Voan'];

const sortLabels: Record<SortKey, string> = {
  newest: 'Mới nhất',
  priceAsc: 'Giá tăng dần',
  priceDesc: 'Giá giảm dần',
  bestSeller: 'Bán chạy nhất',
  favorite: 'Được yêu thích nhất',
};

const gridClassName: Record<GridSize, string> = {
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-3 xl:grid-cols-4',
  5: 'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
};

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function ProductsCollection() {
  const locale = useLocale() as Locale;
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Áo dài Cưới']);
  const [selectedPurchaseTypes, setSelectedPurchaseTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['L']);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [priceLimit, setPriceLimit] = useState(maxPrice);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    const filtered = productCatalog.filter((product) => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const purchaseMatch = selectedPurchaseTypes.length === 0 || selectedPurchaseTypes.includes(product.purchaseType);
      const colorMatch =
        selectedColors.length === 0 || product.colors.some((color) => selectedColors.some((selected) => color.name.includes(selected)));
      const sizeMatch = selectedSizes.length === 0 || product.sizes.some((size) => selectedSizes.includes(size));
      const materialMatch = selectedMaterials.length === 0 || selectedMaterials.includes(product.material);

      return categoryMatch && purchaseMatch && colorMatch && sizeMatch && materialMatch && product.numericPrice <= priceLimit;
    });

    return filtered.sort((a, b) => {
      if (sortKey === 'priceAsc') return a.numericPrice - b.numericPrice;
      if (sortKey === 'priceDesc') return b.numericPrice - a.numericPrice;
      if (sortKey === 'bestSeller') return b.popularity - a.popularity;
      if (sortKey === 'favorite') return b.liked - a.liked;
      return b.id.localeCompare(a.id);
    });
  }, [priceLimit, selectedCategories, selectedColors, selectedMaterials, selectedPurchaseTypes, selectedSizes, sortKey]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const visibleProducts = filteredProducts.slice(pageStart, pageStart + pageSize);

  const toggleValue = (value: string, values: string[], setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    setCurrentPage(1);
  };

  return (
    <div className="mt-12 grid gap-10 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit border-r border-[var(--bg-secondary)] pr-0 lg:sticky lg:top-24 lg:pr-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid size-10 place-items-center bg-[var(--primary-color)] text-white">
            <SlidersHorizontal size={18} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[2px] text-[var(--text-light)]">Bộ lọc</p>
            <h2 className="text-xl font-semibold">Tìm đúng mẫu</h2>
          </div>
        </div>

        <FilterSection title="Loại sản phẩm / Dịp">
          {categoryOptions.map((category) => (
            <CheckOption
              key={category}
              label={category}
              count={productCatalog.filter((product) => product.category === category).length}
              checked={selectedCategories.includes(category)}
              onChange={() => toggleValue(category, selectedCategories, setSelectedCategories)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Hình thức mua">
          {purchaseOptions.map((option) => (
            <CheckOption
              key={option.id}
              label={option.label}
              count={productCatalog.filter((product) => product.purchaseType === option.id).length}
              checked={selectedPurchaseTypes.includes(option.id)}
              onChange={() => toggleValue(option.id, selectedPurchaseTypes, setSelectedPurchaseTypes)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Màu sắc">
          <div className="grid grid-cols-2 gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => toggleValue(color.name, selectedColors, setSelectedColors)}
                className={cn(
                  'flex min-h-9 cursor-pointer items-center gap-2 text-left text-sm text-[var(--text-main)]',
                  selectedColors.includes(color.name) && 'font-semibold text-[var(--primary-color)]'
                )}
              >
                <span
                  className="size-5 rounded-full border border-white shadow-[0_0_0_1px_rgba(42,37,37,0.2)]"
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Size">
          <div className="grid grid-cols-3 gap-2">
            {sizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleValue(size, selectedSizes, setSelectedSizes)}
                className={cn(
                  'min-h-10 cursor-pointer border border-[var(--bg-secondary)] bg-white px-2 text-sm font-semibold transition-colors hover:border-[var(--primary-color)]',
                  selectedSizes.includes(size) && 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Chất liệu">
          {materialOptions.map((material) => (
            <CheckOption
              key={material}
              label={material}
              count={productCatalog.filter((product) => product.material === material).length}
              checked={selectedMaterials.includes(material)}
              onChange={() => toggleValue(material, selectedMaterials, setSelectedMaterials)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Khoảng giá">
          <p className="mb-4 text-sm text-[var(--text-light)]">
            Giá: {formatPrice(minPrice)}đ - {formatPrice(priceLimit)}đ
          </p>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={100000}
            value={priceLimit}
            onChange={(event) => {
              setPriceLimit(Number(event.target.value));
              setCurrentPage(1);
            }}
            className="h-1 w-full cursor-pointer accent-[var(--primary-color)]"
          />
        </FilterSection>
      </aside>

      <div>
        <div className="mb-8 flex flex-col gap-4 border-b border-[var(--bg-secondary)] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-sm text-[var(--text-light)]">
            <div className="flex items-center gap-2">
              <Grid2X2 size={18} className="text-[var(--primary-color)]" />
              <Grid3X3 size={18} />
            </div>
            <span>
              Hiển thị {filteredProducts.length ? pageStart + 1 : 0}-{Math.min(pageStart + pageSize, filteredProducts.length)} của{' '}
              {filteredProducts.length} sản phẩm
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex border border-[var(--bg-secondary)] bg-white">
              {([3, 4, 5] as GridSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setGridSize(size)}
                  className={cn(
                    'grid size-10 cursor-pointer place-items-center text-sm font-bold text-[var(--text-light)] transition-colors',
                    gridSize === size && 'bg-[var(--primary-color)] text-white'
                  )}
                  title={`${size} cột`}
                >
                  {size}
                </button>
              ))}
            </div>

            <label className="relative min-w-56">
              <select
                value={sortKey}
                onChange={(event) => {
                  setSortKey(event.target.value as SortKey);
                  setCurrentPage(1);
                }}
                className="min-h-10 w-full cursor-pointer appearance-none border border-[var(--bg-secondary)] bg-white px-4 pr-10 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary-color)]"
              >
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {sortLabels[key]}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-light)]" />
            </label>
          </div>
        </div>

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
                badge={product.badge}
                colorSwatches={product.colors}
                sizes={product.sizes}
                material={product.material}
                purchaseType={product.purchaseType === 'ready' ? 'Hàng có sẵn' : 'Nhận may đo theo số đo riêng'}
              />
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="grid size-10 cursor-pointer place-items-center border border-[var(--bg-secondary)] bg-white text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            aria-label="Previous page"
          >
            <ArrowLeft size={16} />
          </button>
          {Array.from({ length: pageCount }).map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'size-10 cursor-pointer border border-[var(--bg-secondary)] bg-white text-sm font-semibold text-[var(--text-main)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]',
                  safePage === page && 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white hover:text-white'
                )}
              >
                {page}
              </button>
            );
          })}
          <button
            type="button"
            disabled={safePage === pageCount}
            onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            className="grid size-10 cursor-pointer place-items-center border border-[var(--bg-secondary)] bg-white text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
            aria-label="Next page"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-[var(--bg-secondary)] py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--text-main)]">{title}</h3>
        <ChevronDown size={16} className="text-[var(--text-light)]" />
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function CheckOption({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3 text-sm text-[var(--text-main)]">
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="size-4 cursor-pointer accent-[var(--primary-color)]"
        />
        <span>{label}</span>
      </span>
      <span className="text-[var(--text-light)]">({count})</span>
    </label>
  );
}
