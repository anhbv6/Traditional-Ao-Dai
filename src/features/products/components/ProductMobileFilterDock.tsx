'use client';

import { Check, CircleDollarSign, Layers3, Palette, Search, Shapes, Shirt, Tags } from 'lucide-react';
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Dock, DockIcon } from '@/components/ui/dock';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  categoryOptions,
  CheckOption,
  collectionOptions,
  colorOptions,
  FilterSection,
  formatPrice,
  materialOptions,
  maxPrice,
  minPrice,
  purchaseOptions,
  matchCollection,
} from './FilterSidebar';
import type { MockProduct } from '../data/mockProducts';

type ProductMobileFilterDockProps = {
  locale: 'vi' | 'en';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategories: string[];
  setSelectedCategories: Dispatch<SetStateAction<string[]>>;
  selectedCollections: string[];
  setSelectedCollections: Dispatch<SetStateAction<string[]>>;
  selectedPurchaseTypes: string[];
  setSelectedPurchaseTypes: Dispatch<SetStateAction<string[]>>;
  selectedColors: string[];
  setSelectedColors: Dispatch<SetStateAction<string[]>>;
  selectedMaterials: string[];
  setSelectedMaterials: Dispatch<SetStateAction<string[]>>;
  priceLimit: number;
  setPriceLimit: (limit: number) => void;
  onFilterChange: () => void;
  productCatalog: MockProduct[];
  toggleValue: (value: string, values: string[], setter: Dispatch<SetStateAction<string[]>>) => void;
};

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

function FilterDockDialog({
  title,
  description,
  icon: Icon,
  active = false,
  children,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DockIcon className={cn('bg-white text-[var(--primary-color)] shadow-sm', active && 'bg-[var(--primary-color)] text-white')}>
        <DialogTrigger
          render={
            <button
              type="button"
              aria-label={title}
              className="grid size-full place-items-center rounded-full border-0 bg-transparent p-0 text-current"
            />
          }
        >
          <Icon size={18} strokeWidth={2} />
        </DialogTrigger>
      </DockIcon>
      <DialogContent className="max-h-[78vh] overflow-y-auto rounded-lg bg-[var(--bg-main)] p-5 text-[var(--text-main)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--primary-color)]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-[var(--text-light)]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function ProductMobileFilterDock({
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
}: ProductMobileFilterDockProps) {
  const t = useTranslations('ProductsPage.filter');
  const tp = useTranslations('Product');

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 lg:hidden">
      <Dock
        iconSize={36}
        iconMagnification={44}
        iconDistance={90}
        className="mt-0 h-14 max-w-[calc(100vw-1.5rem)] gap-1 overflow-x-auto rounded-full border-[var(--bg-secondary)] bg-white/85 px-2 shadow-[0_18px_50px_rgba(42,37,37,0.18)]"
      >
        <FilterDockDialog
          title={t('searchTitle')}
          description={t('searchPlaceholder')}
          icon={Search}
          active={searchQuery.length > 0}
        >
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              onFilterChange();
            }}
            placeholder={t('searchPlaceholder')}
            className="bg-white"
          />
        </FilterDockDialog>

        <FilterDockDialog
          title={t('categoryTitle')}
          description={t('clearThisFilter')}
          icon={Tags}
          active={selectedCategories.length > 0}
        >
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
        </FilterDockDialog>

        <FilterDockDialog
          title={t('collectionTitle')}
          description={t('clearThisFilter')}
          icon={Layers3}
          active={selectedCollections.length > 0}
        >
          <FilterSection
            title={t('collectionTitle')}
            onClear={() => {
              setSelectedCollections([]);
              onFilterChange();
            }}
            hasActiveFilters={selectedCollections.length > 0}
          >
            {collectionOptions.map((collection) => (
              <CheckOption
                key={collection.id}
                label={tp(`collections.${collection.id}`)}
                count={productCatalog.filter((product) => matchCollection(product, collection.id)).length}
                checked={selectedCollections.includes(collection.id)}
                onCheckedChange={() => toggleValue(collection.id, selectedCollections, setSelectedCollections)}
              />
            ))}
          </FilterSection>
        </FilterDockDialog>

        <FilterDockDialog
          title={t('purchaseTypeTitle')}
          description={t('clearThisFilter')}
          icon={Shirt}
          active={selectedPurchaseTypes.length > 0}
        >
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
        </FilterDockDialog>

        <FilterDockDialog
          title={t('colorTitle')}
          description={t('clearThisFilter')}
          icon={Palette}
          active={selectedColors.length > 0}
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
                    isSelected && 'font-bold text-[var(--primary-color)]'
                  )}
                >
                  <span
                    className={cn(
                      'relative flex size-6 shrink-0 items-center justify-center rounded-full border border-white shadow-[0_0_0_1px_rgba(42,37,37,0.2)] transition-all duration-200',
                      isSelected && 'shadow-[0_0_0_2px_var(--primary-color)]'
                    )}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected ? (
                      <Check
                        size={12}
                        strokeWidth={4}
                        className={colorKeys[color.name] === 'white' ? 'text-[var(--text-main)]' : 'text-white'}
                      />
                    ) : null}
                  </span>
                  <span>{colorKeys[color.name] ? tp(`colors.${colorKeys[color.name]}`) : color.name}</span>
                </button>
              );
            })}
          </div>
        </FilterDockDialog>

        <FilterDockDialog
          title={t('materialTitle')}
          description={t('clearThisFilter')}
          icon={Shapes}
          active={selectedMaterials.length > 0}
        >
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
        </FilterDockDialog>

        <FilterDockDialog
          title={t('priceTitle')}
          description={t('priceRange', { min: formatPrice(minPrice, locale), max: formatPrice(priceLimit, locale) })}
          icon={CircleDollarSign}
          active={priceLimit < maxPrice}
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
        </FilterDockDialog>
      </Dock>
    </div>
  );
}
