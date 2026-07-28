'use client';

import { Check, CircleDollarSign, Layers3, Palette, Search, Shapes, Shirt, Tags } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentType, Dispatch, ReactNode, SetStateAction } from 'react';
import { useLenis } from 'lenis/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Dock, DockIcon } from '@/components/ui/dock';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  categoryOptions,
  CheckOption,
  collectionOptions,
  colorOptions,
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

let mobilePopoverLockCount = 0;
let mobilePopoverScrollY = 0;
let previousBodyStyles: Pick<CSSStyleDeclaration, 'position' | 'top' | 'left' | 'right' | 'width'> | null = null;

function FilterDockDialog({
  title,
  description,
  icon: Icon,
  active = false,
  onClear,
  clearLabel,
  popoverWidth,
  children,
}: {
  title: string;
  description?: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  active?: boolean;
  onClear?: () => void;
  clearLabel?: string;
  popoverWidth?: number;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const shouldApplyLock = mobilePopoverLockCount === 0;

    mobilePopoverLockCount += 1;

    if (shouldApplyLock) {
      mobilePopoverScrollY = window.scrollY;
      previousBodyStyles = {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
      };
      body.style.position = 'fixed';
      body.style.top = `-${mobilePopoverScrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
    }

    html.classList.add('is-scroll-locked');
    lenis?.stop();

    return () => {
      mobilePopoverLockCount = Math.max(0, mobilePopoverLockCount - 1);

      if (mobilePopoverLockCount === 0) {
        html.classList.remove('is-scroll-locked');
        body.style.position = previousBodyStyles?.position ?? '';
        body.style.top = previousBodyStyles?.top ?? '';
        body.style.left = previousBodyStyles?.left ?? '';
        body.style.right = previousBodyStyles?.right ?? '';
        body.style.width = previousBodyStyles?.width ?? '';
        previousBodyStyles = null;
        window.scrollTo(0, mobilePopoverScrollY);
        lenis?.start();
      }
    };
  }, [isOpen, lenis]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <DockIcon
        className={cn(
          'shadow-sm transition-all duration-300',
          active
            ? 'bg-[var(--primary-color)] text-white shadow-[0_8px_18px_rgba(128,0,32,0.22)]'
            : 'bg-[var(--bg-main)] text-[var(--primary-color)] hover:bg-[var(--bg-secondary)]',
          isOpen && 'z-50 scale-110 bg-[var(--primary-color)] text-white ring-2 ring-[var(--accent-color)] ring-offset-2 ring-offset-[var(--bg-main)] shadow-md'
        )}
      >
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label={title}
              className="grid size-full place-items-center rounded-full border-0 bg-transparent p-0 text-current"
            />
          }
        >
          <Icon size={18} strokeWidth={2} />
        </PopoverTrigger>
      </DockIcon>
      <PopoverContent
        side="top"
        align="center"
        collisionPadding={12}
        sideOffset={28}
        positionMethod="fixed"
        className="max-h-[min(68vh,520px)] overflow-y-auto rounded-lg border border-primary/15 bg-popover p-4 font-[family-name:var(--font-lora)] text-popover-foreground shadow-[0_22px_70px_rgba(42,37,37,0.22)] ring-1 ring-primary/10 [overscroll-behavior:contain] sm:p-5"
        style={{ width: popoverWidth ? `${popoverWidth}px` : 'calc(100vw - 1.5rem)' }}
      >
        <PopoverHeader className="mb-4 border-b border-primary/10 pb-3">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <PopoverTitle className="font-[family-name:var(--font-playfair)] text-lg font-bold leading-tight text-primary">
                {title}
              </PopoverTitle>
              {description && (
                <PopoverDescription className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {description}
                </PopoverDescription>
              )}
            </div>
            {active && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="min-h-8 shrink-0 cursor-pointer rounded-md border border-primary/15 bg-white px-2.5 py-1 text-[11px] font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
              >
                {clearLabel || 'Clear'}
              </button>
            )}
          </div>
        </PopoverHeader>
        <div className="mt-1 text-sm text-foreground">{children}</div>
      </PopoverContent>
    </Popover>
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
  const dockRef = useRef<HTMLDivElement>(null);
  const [popoverWidth, setPopoverWidth] = useState<number>();

  useEffect(() => {
    const syncWidth = () => {
      const dockWidth = dockRef.current?.getBoundingClientRect().width;

      if (dockWidth) {
        setPopoverWidth(Math.round(dockWidth));
      }
    };

    syncWidth();

    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncWidth);

    if (dockRef.current && resizeObserver) {
      resizeObserver.observe(dockRef.current);
    }

    window.addEventListener('resize', syncWidth);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncWidth);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 lg:hidden">
      <Dock
        ref={dockRef}
        iconSize={36}
        iconMagnification={44}
        iconDistance={90}
        className="mt-0 h-14 w-[calc(100vw-1.5rem)] gap-1 overflow-x-auto rounded-full border-[var(--primary-color)]/10 bg-[var(--bg-main)]/92 px-2 shadow-[0_18px_50px_rgba(42,37,37,0.18)] ring-1 ring-white/70"
        style={{ width: 'calc(100vw - 1.5rem)' }}
      >
        <FilterDockDialog
          title={t('searchTitle')}
          description={t('searchPlaceholder')}
          icon={Search}
          active={searchQuery.length > 0}
          popoverWidth={popoverWidth}
          onClear={() => {
            setSearchQuery('');
            onFilterChange();
          }}
          clearLabel={locale === 'vi' ? 'Xóa' : 'Clear'}
        >
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              onFilterChange();
            }}
            placeholder={t('searchPlaceholder')}
            className="border-[var(--primary-color)]/15 bg-white text-[var(--text-main)] placeholder:text-[var(--text-light)] focus:border-[var(--primary-color)] focus:ring-[var(--accent-color)]/30"
          />
        </FilterDockDialog>

        <FilterDockDialog
          title={t('categoryTitle')}
          icon={Tags}
          active={selectedCategories.length > 0}
          popoverWidth={popoverWidth}
          onClear={() => {
            setSelectedCategories([]);
            onFilterChange();
          }}
          clearLabel={locale === 'vi' ? 'Xóa bộ lọc' : 'Clear filter'}
        >
          <div className="flex flex-col gap-3 py-1">
            {categoryOptions.map((category) => (
              <CheckOption
                key={category}
                label={categoryKeys[category] ? tp(`categories.${categoryKeys[category]}`) : category}
                count={productCatalog.filter((product) => product.category === category).length}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleValue(category, selectedCategories, setSelectedCategories)}
              />
            ))}
          </div>
        </FilterDockDialog>

        <FilterDockDialog
          title={t('collectionTitle')}
          icon={Layers3}
          active={selectedCollections.length > 0}
          popoverWidth={popoverWidth}
          onClear={() => {
            setSelectedCollections([]);
            onFilterChange();
          }}
          clearLabel={locale === 'vi' ? 'Xóa bộ lọc' : 'Clear filter'}
        >
          <div className="flex flex-col gap-3 py-1">
            {collectionOptions.map((collection) => (
              <CheckOption
                key={collection.id}
                label={tp(`collections.${collection.id}`)}
                count={productCatalog.filter((product) => matchCollection(product, collection.id)).length}
                checked={selectedCollections.includes(collection.id)}
                onCheckedChange={() => toggleValue(collection.id, selectedCollections, setSelectedCollections)}
              />
            ))}
          </div>
        </FilterDockDialog>

        <FilterDockDialog
          title={t('purchaseTypeTitle')}
          icon={Shirt}
          active={selectedPurchaseTypes.length > 0}
          popoverWidth={popoverWidth}
          onClear={() => {
            setSelectedPurchaseTypes([]);
            onFilterChange();
          }}
          clearLabel={locale === 'vi' ? 'Xóa bộ lọc' : 'Clear filter'}
        >
          <div className="flex flex-col gap-3 py-1">
            {purchaseOptions.map((option) => (
              <CheckOption
                key={option.id}
                label={tp(`purchaseTypes.${option.id}`)}
                count={productCatalog.filter((product) => product.purchaseType === option.id).length}
                checked={selectedPurchaseTypes.includes(option.id)}
                onCheckedChange={() => toggleValue(option.id, selectedPurchaseTypes, setSelectedPurchaseTypes)}
              />
            ))}
          </div>
        </FilterDockDialog>

        <FilterDockDialog
          title={t('colorTitle')}
          icon={Palette}
          active={selectedColors.length > 0}
          popoverWidth={popoverWidth}
          onClear={() => {
            setSelectedColors([]);
            onFilterChange();
          }}
          clearLabel={locale === 'vi' ? 'Xóa bộ lọc' : 'Clear filter'}
        >
          <div className="grid grid-cols-2 gap-3 py-1">
            {colorOptions.map((color) => {
              const isSelected = selectedColors.includes(color.name);

              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => toggleValue(color.name, selectedColors, setSelectedColors)}
                  className={cn(
                    'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-md px-1.5 text-left text-sm text-[var(--text-light)] transition-all duration-200 hover:bg-white hover:text-[var(--primary-color)]',
                    isSelected && 'bg-white font-bold text-[var(--primary-color)]'
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
          icon={Shapes}
          active={selectedMaterials.length > 0}
          popoverWidth={popoverWidth}
          onClear={() => {
            setSelectedMaterials([]);
            onFilterChange();
          }}
          clearLabel={locale === 'vi' ? 'Xóa bộ lọc' : 'Clear filter'}
        >
          <div className="flex flex-col gap-3 py-1">
            {materialOptions.map((material) => (
              <CheckOption
                key={material}
                label={materialKeys[material] ? tp(`materials.${materialKeys[material]}`) : material}
                count={productCatalog.filter((product) => product.material === material).length}
                checked={selectedMaterials.includes(material)}
                onCheckedChange={() => toggleValue(material, selectedMaterials, setSelectedMaterials)}
              />
            ))}
          </div>
        </FilterDockDialog>

        <FilterDockDialog
          title={t('priceTitle')}
          description={t('priceRange', { min: formatPrice(minPrice, locale), max: formatPrice(priceLimit, locale) })}
          icon={CircleDollarSign}
          active={priceLimit < maxPrice}
          popoverWidth={popoverWidth}
          onClear={() => {
            setPriceLimit(maxPrice);
            onFilterChange();
          }}
          clearLabel={locale === 'vi' ? 'Đặt lại' : 'Reset'}
        >
          <div className="py-2">
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
              className="h-1.5 w-full cursor-pointer rounded-lg bg-[var(--bg-secondary)] accent-[var(--primary-color)]"
            />
          </div>
        </FilterDockDialog>
      </Dock>
    </div>
  );
}
