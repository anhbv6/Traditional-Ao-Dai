'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, SlidersHorizontal, Search, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { MockProduct } from '../data/mockProducts';

export const minPrice = 500000;
export const maxPrice = 5000000;

export const categoryOptions = ['Áo dài Cưới', 'Áo dài Cách tân', 'Áo dài Lễ/Tết', 'Áo dài Trẻ em', 'Phụ kiện'];
export const purchaseOptions = [
  { id: 'ready', label: 'Hàng có sẵn' },
  { id: 'custom', label: 'Nhận may đo riêng' },
];
export const colorOptions = [
  { name: 'Đỏ', hex: '#B32530' },
  { name: 'Vàng', hex: '#D8A928' },
  { name: 'Hồng', hex: '#E2A79E' },
  { name: 'Trắng', hex: '#F7F0E8' },
  { name: 'Lụa trơn', hex: '#C9B29B' },
  { name: 'Gấm thêu', hex: '#B77B3D' },
];
export const materialOptions = ['Lụa Tơ Tằm', 'Gấm', 'Tơ Nhung', 'Voan'];

export const collectionOptions = [
  { id: 'wedding', label: 'Áo Dài Cưới' },
  { id: 'modern', label: 'Áo Dài Cách Tân' },
  { id: 'silk', label: 'Áo Dài Lụa Tơ Tằm' },
  { id: 'brocade', label: 'Áo Dài Gấm Luxury' },
  { id: 'embroidered', label: 'Áo Dài Thêu Tay' },
];

const categoryKeys: Record<string, string> = {
  'Áo dài Cưới': 'wedding',
  'Áo dài Cách tân': 'modern',
  'Áo dài Lễ/Tết': 'festival',
  'Áo dài Trẻ em': 'kids',
  'Phụ kiện': 'accessories',
};

const colorKeys: Record<string, string> = {
  'Đỏ': 'red',
  'Vàng': 'yellow',
  'Hồng': 'pink',
  'Trắng': 'white',
  'Lụa trơn': 'plainSilk',
  'Gấm thêu': 'embroideredBrocade',
};

const materialKeys: Record<string, string> = {
  'Lụa Tơ Tằm': 'silk',
  'Gấm': 'brocade',
  'Tơ Nhung': 'velvet',
  'Voan': 'chiffon',
};

export function formatPrice(value: number, locale: string) {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value);
}

// Collection match helper
export const matchCollection = (product: MockProduct, colId: string) => {
  if (colId === 'wedding') return product.category === 'Áo dài Cưới';
  if (colId === 'modern') return product.category === 'Áo dài Cách tân';
  if (colId === 'silk') return product.material === 'Lụa Tơ Tằm';
  if (colId === 'brocade') return product.material === 'Gấm';
  if (colId === 'embroidered') {
    return (
      product.name.vi.toLowerCase().includes('thêu') ||
      product.description.vi.toLowerCase().includes('thêu')
    );
  }
  return false;
};

interface FilterSidebarProps {
  locale: 'vi' | 'en';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCollections: string[];
  setSelectedCollections: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPurchaseTypes: string[];
  setSelectedPurchaseTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedMaterials: string[];
  setSelectedMaterials: React.Dispatch<React.SetStateAction<string[]>>;
  priceLimit: number;
  setPriceLimit: (limit: number) => void;
  onFilterChange: () => void;
  productCatalog: MockProduct[];
  toggleValue: (value: string, values: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => void;
}

export function FilterSidebar({
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
  onFilterChange,
  productCatalog,
  toggleValue,
}: FilterSidebarProps) {
  const t = useTranslations('ProductsPage.filter');
  const tp = useTranslations('Product');

  return (
    <aside
      data-lenis-prevent
      className="hidden border-r border-[var(--bg-secondary)] pr-0 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-8 pr-2 custom-scrollbar"
    >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--bg-secondary);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--accent-color);
        }
        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--bg-secondary) transparent;
        }
      `}</style>
      <div className="mb-7 flex items-center gap-3">
        <span className="grid size-10 place-items-center bg-[var(--primary-color)] rounded-[4px] text-white">
          <SlidersHorizontal size={18} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[2px] text-[var(--text-light)]">{t('title')}</p>
          <h2 className="text-xl font-semibold">{t('subtitle')}</h2>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-3 flex items-center text-[var(--text-light)] pointer-events-none">
          <Search size={18} />
        </span>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onFilterChange();
          }}
          placeholder={t('searchPlaceholder')}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <FilterSection
        title={t('categoryTitle')}
        onClear={() => {
          setSelectedCategories([]);
          onFilterChange();
        }}
        hasActiveFilters={selectedCategories.length > 0}
      >
        {categoryOptions.map((category) => (
          <CheckOption
            key={category}
            label={categoryKeys[category] ? tp(`categories.${categoryKeys[category]}`) : category}
            count={productCatalog.filter((product) => product.category === category).length}
            checked={selectedCategories.includes(category)}
            onCheckedChange={() => toggleValue(category, selectedCategories, setSelectedCategories)}
          />
        ))}
      </FilterSection>

      {/* Collection Filter */}
      <FilterSection
        title={t('collectionTitle')}
        onClear={() => {
          setSelectedCollections([]);
          onFilterChange();
        }}
        hasActiveFilters={selectedCollections.length > 0}
      >
        {collectionOptions.map((col) => (
          <CheckOption
            key={col.id}
            label={tp(`collections.${col.id}`)}
            count={productCatalog.filter((product) => matchCollection(product, col.id)).length}
            checked={selectedCollections.includes(col.id)}
            onCheckedChange={() => toggleValue(col.id, selectedCollections, setSelectedCollections)}
          />
        ))}
      </FilterSection>

      {/* Purchase Type Filter */}
      <FilterSection
        title={t('purchaseTypeTitle')}
        onClear={() => {
          setSelectedPurchaseTypes([]);
          onFilterChange();
        }}
        hasActiveFilters={selectedPurchaseTypes.length > 0}
      >
        {purchaseOptions.map((option) => (
          <CheckOption
            key={option.id}
            label={tp(`purchaseTypes.${option.id}`)}
            count={productCatalog.filter((product) => product.purchaseType === option.id).length}
            checked={selectedPurchaseTypes.includes(option.id)}
            onCheckedChange={() => toggleValue(option.id, selectedPurchaseTypes, setSelectedPurchaseTypes)}
          />
        ))}
      </FilterSection>

      {/* Color Filter */}
      <FilterSection
        title={t('colorTitle')}
        onClear={() => setSelectedColors([])}
        hasActiveFilters={selectedColors.length > 0}
      >
        <div className="grid grid-cols-2 gap-3">
          {colorOptions.map((color) => {
            const isSelected = selectedColors.includes(color.name);
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => toggleValue(color.name, selectedColors, setSelectedColors)}
                className={cn(
                  'flex min-h-10 cursor-pointer items-center gap-2.5 text-left text-sm text-[var(--text-light)] transition-all duration-200 hover:text-[var(--primary-color)]',
                  isSelected && 'font-bold text-[var(--primary-color)] scale-[1.02]'
                )}
              >
                <span
                  className={cn(
                    "relative flex size-6 shrink-0 items-center justify-center rounded-full border border-white shadow-[0_0_0_1px_rgba(42,37,37,0.2)] transition-all duration-200",
                    isSelected && "shadow-[0_0_0_2px_var(--primary-color)] scale-[1.08]"
                  )}
                  style={{ backgroundColor: color.hex }}
                >
                  {isSelected && (
                    <Check
                      size={12}
                      strokeWidth={4}
                      className={colorKeys[color.name] === 'white' ? 'text-[var(--text-main)]' : 'text-white'}
                    />
                  )}
                </span>
                <span>{colorKeys[color.name] ? tp(`colors.${colorKeys[color.name]}`) : color.name}</span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Material Filter */}
      <FilterSection
        title={t('materialTitle')}
        onClear={() => {
          setSelectedMaterials([]);
          onFilterChange();
        }}
        hasActiveFilters={selectedMaterials.length > 0}
      >
        {materialOptions.map((material) => (
          <CheckOption
            key={material}
            label={materialKeys[material] ? tp(`materials.${materialKeys[material]}`) : material}
            count={productCatalog.filter((product) => product.material === material).length}
            checked={selectedMaterials.includes(material)}
            onCheckedChange={() => toggleValue(material, selectedMaterials, setSelectedMaterials)}
          />
        ))}
      </FilterSection>

      {/* Price Limit Filter */}
      <FilterSection
        title={t('priceTitle')}
        onClear={() => {
          setPriceLimit(maxPrice);
          onFilterChange();
        }}
        hasActiveFilters={priceLimit < maxPrice}
      >
        <p className="mb-4 text-sm text-[var(--text-light)]">
          {t('priceRange', { min: formatPrice(minPrice, locale), max: formatPrice(priceLimit, locale) })}
        </p>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={100000}
          value={priceLimit}
          onChange={(event) => {
            setPriceLimit(Number(event.target.value));
            onFilterChange();
          }}
          className="h-1 w-full cursor-pointer accent-[var(--primary-color)]"
        />
      </FilterSection>
    </aside>
  );
}

export function FilterSection({
  title,
  children,
  defaultOpen = true,
  onClear,
  hasActiveFilters = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  onClear?: () => void;
  hasActiveFilters?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const t = useTranslations('ProductsPage.filter');

  return (
    <section className="border-t border-[var(--bg-secondary)] py-3">
      <div className="flex items-center justify-between gap-3 select-none">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 cursor-pointer group flex-1"
        >
          <span
            className={cn(
              "w-1 h-3.5 rounded-full bg-[var(--primary-color)] transition-all duration-300",
              isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          />
          <h3
            className={cn(
              "text-base transition-all duration-200",
              isOpen
                ? "font-bold text-[var(--primary-color)]"
                : "font-semibold text-[var(--text-main)] group-hover:text-[var(--primary-color)]"
            )}
          >
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          {onClear && hasActiveFilters && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="grid size-5 place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-light)] hover:bg-[var(--primary-color)] hover:text-white transition-colors cursor-pointer"
              title={t('clearThisFilter')}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          )}
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="cursor-pointer text-[var(--text-light)] hover:text-[var(--primary-color)] transition-colors"
          >
            <ChevronDown
              size={16}
              className={cn(
                "transition-transform duration-200",
                isOpen ? "rotate-0" : "-rotate-90"
              )}
            />
          </div>
        </div>
      </div>
      <div
        className={cn(
          "space-y-3 transition-all duration-300 overflow-hidden",
          isOpen ? "max-h-[1000px] opacity-100 mt-6" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function CheckOption({
  label,
  count,
  checked,
  onCheckedChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3 text-sm text-[var(--text-main)]">
      <span className="flex items-center gap-3 select-none">
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="cursor-pointer"
        />
        <span>{label}</span>
      </span>
      <span className="text-[var(--text-light)]">({count})</span>
    </label>
  );
}
