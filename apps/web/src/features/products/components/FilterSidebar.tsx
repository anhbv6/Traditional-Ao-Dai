'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
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

export const categoryKeys: Record<string, string> = {
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

export const materialKeys: Record<string, string> = {
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
  activeFilterCount: number;
  onClearAll: () => void;
}

export type FilterGroupsProps = Omit<FilterSidebarProps, 'activeFilterCount' | 'onClearAll'>;

/**
 * Cột lọc bên trái (desktop): không khung, không ô icon — chỉ tiêu đề nhỏ in hoa và vạch kẻ mảnh,
 * để sự chú ý dồn về lưới sản phẩm. "Danh mục" đã có thanh tab phía trên lưới nên không lặp lại ở đây.
 */
export function FilterSidebar({ activeFilterCount, onClearAll, ...groupProps }: FilterSidebarProps) {
  const t = useTranslations('ProductsPage.filter');

  return (
    <aside
      data-lenis-prevent
      className="hidden [scrollbar-width:none] lg:sticky lg:top-28 lg:block lg:max-h-[calc(100vh-140px)] lg:self-start lg:overflow-y-auto lg:pr-4"
    >
      <div className="flex items-baseline justify-between border-b border-[var(--text-main)]/80 pb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--text-main)]">{t('title')}</h2>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onClearAll}
            className="cursor-pointer text-xs text-[var(--text-light)] underline-offset-4 transition-colors hover:text-[var(--primary-color)] hover:underline"
          >
            {t('clearAll', { count: activeFilterCount })}
          </button>
        ) : null}
      </div>
      <FilterGroups {...groupProps} />
    </aside>
  );
}

/** Các nhóm lọc (bộ sưu tập, hình thức mua, màu, chất liệu, giá) — dùng chung cho cột lọc desktop và sheet lọc mobile */
export function FilterGroups({
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
  onFilterChange,
  productCatalog,
  toggleValue,
}: FilterGroupsProps) {
  const t = useTranslations('ProductsPage.filter');
  const tp = useTranslations('Product');

  return (
    <>
      <FilterSection
        title={t('collectionTitle')}
        activeCount={selectedCollections.length}
        onClear={() => {
          setSelectedCollections([]);
          onFilterChange();
        }}
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

      <FilterSection
        title={t('purchaseTypeTitle')}
        activeCount={selectedPurchaseTypes.length}
        onClear={() => {
          setSelectedPurchaseTypes([]);
          onFilterChange();
        }}
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

      <FilterSection
        title={t('colorTitle')}
        activeCount={selectedColors.length}
        onClear={() => {
          setSelectedColors([]);
          onFilterChange();
        }}
      >
        <div className="flex flex-wrap gap-2.5">
          {colorOptions.map((color) => {
            const isSelected = selectedColors.includes(color.name);
            const label = colorKeys[color.name] ? tp(`colors.${colorKeys[color.name]}`) : color.name;
            return (
              <button
                key={color.name}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={isSelected}
                onClick={() => toggleValue(color.name, selectedColors, setSelectedColors)}
                className={cn(
                  'grid size-8 cursor-pointer place-items-center rounded-full border border-black/10 ring-offset-2 ring-offset-[var(--bg-main)] transition-shadow duration-200 hover:ring-1 hover:ring-[var(--text-light)]',
                  isSelected && 'ring-1 ring-[var(--primary-color)] hover:ring-[var(--primary-color)]'
                )}
                style={{ backgroundColor: color.hex }}
              >
                {isSelected ? (
                  <Check size={13} strokeWidth={3} className={colorKeys[color.name] === 'white' ? 'text-[var(--text-main)]' : 'text-white'} />
                ) : null}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection
        title={t('materialTitle')}
        activeCount={selectedMaterials.length}
        onClear={() => {
          setSelectedMaterials([]);
          onFilterChange();
        }}
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

      <FilterSection
        title={t('priceTitle')}
        activeCount={priceLimit < maxPrice ? 1 : 0}
        onClear={() => {
          setPriceLimit(maxPrice);
          onFilterChange();
        }}
      >
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={100000}
          value={priceLimit}
          aria-label={t('priceTitle')}
          onChange={(event) => {
            setPriceLimit(Number(event.target.value));
            onFilterChange();
          }}
          className="h-1 w-full cursor-pointer accent-[var(--primary-color)]"
        />
        <p className="mt-3 flex justify-between text-xs text-[var(--text-light)]">
          <span>{formatPrice(minPrice, locale)}đ</span>
          <span className="font-semibold text-[var(--text-main)]">{t('priceUpTo', { max: formatPrice(priceLimit, locale) })}</span>
        </p>
      </FilterSection>
    </>
  );
}

/** Một nhóm lọc mở/đóng được; hiện số mục đang chọn và nút xóa riêng của nhóm */
export function FilterSection({
  title,
  children,
  defaultOpen = true,
  activeCount = 0,
  onClear,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  activeCount?: number;
  onClear?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const t = useTranslations('ProductsPage.filter');

  return (
    <section className="border-b border-[var(--border)] py-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 cursor-pointer items-center gap-2 text-left text-sm font-semibold text-[var(--text-main)] transition-colors hover:text-[var(--primary-color)]"
        >
          {title}
          {activeCount > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-[var(--primary-color)] text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
        {onClear && activeCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer text-xs text-[var(--text-light)] transition-colors hover:text-[var(--primary-color)]"
          >
            {t('clear')}
          </button>
        ) : null}
        <button
          type="button"
          aria-label={title}
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer text-[var(--text-light)] transition-colors hover:text-[var(--primary-color)]"
        >
          <ChevronDown size={16} strokeWidth={1.6} className={cn('transition-transform duration-300', isOpen ? 'rotate-180' : 'rotate-0')} />
        </button>
      </div>
      {/* Mở/đóng mượt bằng grid-rows 0fr -> 1fr (không cần đo chiều cao) */}
      <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="space-y-2.5 pt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Một lựa chọn dạng ô tích — dùng chung cho cột lọc desktop và dock lọc mobile */
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
    <label className="group flex min-h-7 cursor-pointer items-center justify-between gap-3 text-sm">
      <span className="flex select-none items-center gap-3">
        <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="size-4 rounded-[3px] shadow-none" />
        <span className={cn('transition-colors', checked ? 'text-[var(--primary-color)]' : 'text-[var(--text-main)] group-hover:text-[var(--primary-color)]')}>
          {label}
        </span>
      </span>
      <span className="text-xs tabular-nums text-[var(--text-light)]/70">{count}</span>
    </label>
  );
}
