'use client';

import { type ReactNode, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatVnd } from '@repo/shared';
import { cn } from '@/lib/utils';
import type { MockProduct } from '../data/mockProducts';
import { ProductSearchInput } from './ProductSearchInput';
import { FilterChip } from './FilterChip';
import { minPrice, maxPrice, purchaseOptions, colorOptions, materialOptions, collectionOptions, colorKeys, materialKeys, matchCollection } from '../constants/filters';

/** Mức giá chọn nhanh (giá tối đa) — `maxPrice` nghĩa là không giới hạn */
const pricePresets = [1500000, 2000000, 3000000, maxPrice];

/** Giá rút gọn cho chip: 1,5tr / 1.5M */
function formatPriceShort(value: number, locale: string) {
  const millions = value / 1000000;
  return locale === 'vi' ? `${String(millions).replace('.', ',')}tr` : `${millions}M`;
}

const getColorLabel = (name: string, tp: (key: string) => string) => (colorKeys[name] ? tp(`colors.${colorKeys[name]}`) : name);
const getMaterialLabel = (material: string, tp: (key: string) => string) =>
  materialKeys[material] ? tp(`materials.${materialKeys[material]}`) : material;

interface FilterGroupsProps {
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
}

export type { FilterGroupsProps };

/** Phần đầu bộ lọc dùng chung desktop / mobile: từ khóa, số bộ lọc đang bật, nút xóa tất cả */
export interface FilterSummaryProps extends FilterGroupsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilterCount: number;
  onClearAll: () => void;
}

/**
 * Cột lọc bên trái (desktop), ghim theo khi cuộn:
 * - Phần đầu CỐ ĐỊNH: ô tìm kiếm → tiêu đề + "Xóa tất cả" → chip các bộ lọc đang bật (bấm để bỏ từng cái).
 * - Bên dưới là các nhóm lọc, tự cuộn riêng khi dài hơn khung nhìn — phần đầu không bị trôi theo.
 * "Danh mục" đã có thanh tab phía trên lưới nên không lặp lại ở đây.
 */
export function FilterSidebar({ searchQuery, onSearchChange, activeFilterCount, onClearAll, ...groupProps }: FilterSummaryProps) {
  const t = useTranslations('ProductsPage.filter');
  const canClear = activeFilterCount > 0 || searchQuery.trim().length > 0;

  return (
    <aside className="hidden lg:sticky lg:top-[calc(var(--site-header-h)+1rem)] lg:flex lg:max-h-[calc(100vh-var(--site-header-h)-2rem)] lg:flex-col lg:self-start">
      <div className="shrink-0 space-y-4 border-b border-[var(--text-main)]/80 pb-4">
        <ProductSearchInput value={searchQuery} onChange={onSearchChange} />
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--text-main)]">{t('title')}</h2>
          {canClear ? (
            <button
              type="button"
              onClick={onClearAll}
              className="cursor-pointer text-xs text-[var(--text-light)] underline-offset-4 transition-colors hover:text-[var(--primary-ink)] hover:underline"
            >
              {activeFilterCount > 0 ? t('clearAll', { count: activeFilterCount }) : t('clearAllShort')}
            </button>
          ) : null}
        </div>
        <ActiveFilters searchQuery={searchQuery} onSearchChange={onSearchChange} {...groupProps} />
      </div>

      <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
        <FilterGroups {...groupProps} />
      </div>
    </aside>
  );
}

/**
 * Chip các bộ lọc đang bật — nhìn là biết đang lọc gì, bấm ✕ để bỏ đúng lựa chọn đó.
 * Không có bộ lọc nào thì không chiếm chỗ.
 */
export function ActiveFilters({
  searchQuery,
  onSearchChange,
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
  toggleValue,
}: FilterGroupsProps & { searchQuery?: string; onSearchChange?: (query: string) => void }) {
  const t = useTranslations('ProductsPage.filter');
  const tp = useTranslations('Product');
  const query = searchQuery?.trim();

  const chips = [
    ...(query && onSearchChange ? [{ key: 'q', label: `“${query}”`, onRemove: () => onSearchChange('') }] : []),
    ...selectedCollections.map((id) => ({
      key: `col-${id}`,
      label: tp(`collections.${id}`),
      onRemove: () => toggleValue(id, selectedCollections, setSelectedCollections),
    })),
    ...selectedPurchaseTypes.map((id) => ({
      key: `buy-${id}`,
      label: tp(`purchaseTypes.${id}`),
      onRemove: () => toggleValue(id, selectedPurchaseTypes, setSelectedPurchaseTypes),
    })),
    ...selectedColors.map((name) => ({
      key: `color-${name}`,
      label: getColorLabel(name, tp),
      onRemove: () => toggleValue(name, selectedColors, setSelectedColors),
    })),
    ...selectedMaterials.map((material) => ({
      key: `mat-${material}`,
      label: getMaterialLabel(material, tp),
      onRemove: () => toggleValue(material, selectedMaterials, setSelectedMaterials),
    })),
    ...(priceLimit < maxPrice
      ? [
          {
            key: 'price',
            label: t('priceUpTo', { max: formatVnd(priceLimit, locale) }),
            onRemove: () => {
              setPriceLimit(maxPrice);
              onFilterChange();
            },
          },
        ]
      : []),
  ];

  if (chips.length === 0) return null;

  return (
    <ul aria-label={t('activeTitle')} className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={t('removeFilter', { label: chip.label })}
            className="group/chip inline-flex max-w-full cursor-pointer items-center gap-1.5 bg-[var(--primary-color)]/8 py-1 pl-2.5 pr-1.5 text-xs text-[var(--primary-ink)] transition-colors hover:bg-[var(--primary-color)] hover:text-white"
          >
            <span className="truncate">{chip.label}</span>
            <X size={12} strokeWidth={2} className="shrink-0 opacity-60 group-hover/chip:opacity-100" />
          </button>
        </li>
      ))}
    </ul>
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

  const clearGroup = (setter: React.Dispatch<React.SetStateAction<string[]>>) => () => {
    setter([]);
    onFilterChange();
  };
  const applyPrice = (limit: number) => {
    setPriceLimit(limit);
    onFilterChange();
  };

  return (
    <>
      {/* Mặc định chỉ mở Bộ sưu tập; nhóm khác tự mở khi vào trang đã có lựa chọn (đến từ màn khác qua URL) */}
      <FilterSection title={t('collectionTitle')} defaultOpen activeCount={selectedCollections.length} onClear={clearGroup(setSelectedCollections)}>
        <ChipGroup>
          {collectionOptions.map((col) => (
            <FilterChip
              key={col.id}
              label={tp(`collections.${col.id}`)}
              count={productCatalog.filter((product) => matchCollection(product, col.id)).length}
              selected={selectedCollections.includes(col.id)}
              onToggle={() => toggleValue(col.id, selectedCollections, setSelectedCollections)}
            />
          ))}
        </ChipGroup>
      </FilterSection>

      <FilterSection title={t('purchaseTypeTitle')} activeCount={selectedPurchaseTypes.length} onClear={clearGroup(setSelectedPurchaseTypes)}>
        <ChipGroup>
          {purchaseOptions.map((option) => (
            <FilterChip
              key={option.id}
              label={tp(`purchaseTypes.${option.id}`)}
              count={productCatalog.filter((product) => product.purchaseType === option.id).length}
              selected={selectedPurchaseTypes.includes(option.id)}
              onToggle={() => toggleValue(option.id, selectedPurchaseTypes, setSelectedPurchaseTypes)}
            />
          ))}
        </ChipGroup>
      </FilterSection>

      <FilterSection title={t('colorTitle')} activeCount={selectedColors.length} onClear={clearGroup(setSelectedColors)}>
        {/* Ô màu kèm tên — không phải rê chuột mới biết là màu gì */}
        <ChipGroup>
          {colorOptions.map((color) => (
            <FilterChip
              key={color.name}
              label={getColorLabel(color.name, tp)}
              selected={selectedColors.includes(color.name)}
              onToggle={() => toggleValue(color.name, selectedColors, setSelectedColors)}
              leading={<span aria-hidden="true" className="size-3.5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />}
            />
          ))}
        </ChipGroup>
      </FilterSection>

      <FilterSection title={t('materialTitle')} activeCount={selectedMaterials.length} onClear={clearGroup(setSelectedMaterials)}>
        <ChipGroup>
          {materialOptions.map((material) => (
            <FilterChip
              key={material}
              label={getMaterialLabel(material, tp)}
              count={productCatalog.filter((product) => product.material === material).length}
              selected={selectedMaterials.includes(material)}
              onToggle={() => toggleValue(material, selectedMaterials, setSelectedMaterials)}
            />
          ))}
        </ChipGroup>
      </FilterSection>

      <FilterSection title={t('priceTitle')} activeCount={priceLimit < maxPrice ? 1 : 0} onClear={() => applyPrice(maxPrice)}>
        {/* Bấm nhanh mức giá hay dùng; cần chính xác hơn thì kéo thanh bên dưới */}
        <div className="grid grid-cols-4 gap-1.5">
          {pricePresets.map((preset) => (
            <FilterChip
              key={preset}
              label={preset === maxPrice ? t('priceAll') : `≤ ${formatPriceShort(preset, locale)}`}
              selected={priceLimit === preset}
              onToggle={() => applyPrice(preset)}
              className="w-full justify-center px-1"
            />
          ))}
        </div>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={100000}
          value={priceLimit}
          aria-label={t('priceTitle')}
          onChange={(event) => applyPrice(Number(event.target.value))}
          className="mt-4 h-1 w-full cursor-pointer accent-[var(--primary-color)]"
        />
        <p className="mt-2 flex justify-between text-xs text-[var(--text-light)]">
          <span>{formatVnd(minPrice, locale)}</span>
          <span className="font-semibold text-[var(--text-main)]">
            {priceLimit < maxPrice ? t('priceUpTo', { max: formatVnd(priceLimit, locale) }) : t('priceAll')}
          </span>
        </p>
      </FilterSection>
    </>
  );
}

/**
 * Một nhóm lọc mở/đóng được; hiện số mục đang chọn và nút xóa riêng của nhóm.
 * Trạng thái mở ban đầu: `defaultOpen` HOẶC nhóm đang có lựa chọn lúc dựng (vd. vào từ `?color=red`).
 */
export function FilterSection({
  title,
  children,
  defaultOpen = false,
  activeCount = 0,
  onClear,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  activeCount?: number;
  onClear?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen || activeCount > 0);
  const t = useTranslations('ProductsPage.filter');

  return (
    <section className="border-b border-[var(--border)] py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        {/* Cả hàng tiêu đề là một nút mở/đóng — vùng bấm lớn, mũi tên chỉ là dấu hiệu */}
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 cursor-pointer items-center gap-2 text-left text-sm font-semibold text-[var(--text-main)] transition-colors hover:text-[var(--primary-ink)]"
        >
          <ChevronDown
            size={15}
            strokeWidth={1.6}
            className={cn('shrink-0 text-[var(--text-light)] transition-transform duration-300', isOpen ? 'rotate-0' : '-rotate-90')}
          />
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
            className="cursor-pointer text-xs text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)]"
          >
            {t('clear')}
          </button>
        ) : null}
      </div>
      {/* Mở/đóng mượt bằng grid-rows 0fr -> 1fr (không cần đo chiều cao) */}
      <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

function ChipGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}
