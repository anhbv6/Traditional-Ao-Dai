'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type ProductColorSwatch = {
  name: string;
  hex: string;
  imageSrc?: string;
};

type ProductCardProps = {
  imageSrc?: string;
  hoverImageSrc?: string;
  imageAlt?: string;
  name?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  // badge?: string;
  colorSwatches?: ProductColorSwatch[];
  sizes?: string[];
  material?: string;
  purchaseType?: string;
  objectFit?: 'cover' | 'contain';
};

const materialKeys: Record<string, string> = {
  'Lụa Tơ Tằm': 'silk',
  'Gấm': 'brocade',
  'Tơ Nhung': 'velvet',
  'Voan': 'chiffon',
};

function ProductCard({
  imageSrc = '/logoPage.png',
  hoverImageSrc,
  imageAlt = 'Product image',
  name = 'Allen Solly',
  description = 'Women Textured Handheld Bag',
  price = '$80.00',
  originalPrice = '$100.00',
  // badge,
  colorSwatches = [],
  sizes = [],
  material,
  purchaseType,
  objectFit,
}: ProductCardProps) {
  const t = useTranslations('Product');
  const fallbackImageSrc = '/logoPage.png';
  const [isHovered, setIsHovered] = useState(false);
  const selectedColorIndex: number | null = null;
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const swatchImageSrc = selectedColorIndex === null ? undefined : colorSwatches[selectedColorIndex]?.imageSrc;
  const displayImageSrc = swatchImageSrc ?? (isHovered && hoverImageSrc ? hoverImageSrc : imageSrc);
  const currentImageSrc = failedImageSrc === displayImageSrc ? fallbackImageSrc : displayImageSrc;
  const isPlaceholder = currentImageSrc === fallbackImageSrc;
  const fitMode = objectFit ?? (isPlaceholder ? 'contain' : 'cover');
  const imageClassName = `transition-transform duration-[800ms] cubic-bezier(0.25, 1, 0.5, 1) group-hover:scale-[1.04] ${
    fitMode === 'cover' ? 'object-cover' : 'object-contain px-8 py-10 sm:px-10'
  }`;

  return (
    <article
      className="group w-full overflow-hidden font-[family-name:var(--font-lora)] text-[var(--text-main)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-secondary)]">
        <Image
          src={currentImageSrc}
          alt={imageAlt}
          fill={true}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 44vw, (max-width: 1280px) 25vw, 300px"
          className={imageClassName}
          onError={() => setFailedImageSrc(displayImageSrc)}
        />
        {/* {badge ? (
          <span className="absolute left-3 top-3 bg-[var(--primary-color)] px-3 py-1 text-[10px] font-bold uppercase tracking-[1.6px] text-white shadow-sm">
            {badge}
          </span>
        ) : null} */}

        <div className="absolute right-2 top-3 flex translate-x-0 flex-col gap-2 opacity-100 transition-all duration-[600ms] ease-out sm:right-4 sm:top-4 sm:translate-x-3 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
          <button
            type="button"
            aria-label={t('addToWishlist')}
            className="cursor-pointer grid size-8 place-items-center rounded-full bg-white text-[var(--text-main)] shadow-sm transition-colors duration-300 hover:bg-[var(--primary-color)] hover:text-white sm:size-10"
          >
            <Heart size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={t('quickView')}
            onClick={() => setIsQuickViewOpen(true)}
            className="cursor-pointer grid size-8 place-items-center rounded-full bg-white text-[var(--text-main)] shadow-sm transition-colors duration-300 hover:bg-[var(--primary-color)] hover:text-white sm:size-10"
          >
            <Eye size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={t('addToCart')}
            className="cursor-pointer grid size-8 place-items-center rounded-full bg-white text-[var(--text-main)] shadow-sm transition-colors duration-300 hover:bg-[var(--primary-color)] hover:text-white sm:size-10"
          >
            <ShoppingBag size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="absolute inset-x-3 bottom-3 rounded-xl translate-y-0 shadow-md transition-all duration-[600ms] ease-out sm:inset-x-5 sm:bottom-5 sm:translate-y-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          {/* {sizes.length ? (
            <div className="mb-2 grid grid-cols-5 gap-1">
              {sizes.slice(0, 5).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    'min-h-7 cursor-pointer border border-[var(--bg-secondary)] text-[10px] font-bold text-[var(--text-main)] transition-colors hover:border-[var(--primary-color)]',
                    selectedSize === size && 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          ) : null} */}
          <button
            type="button"
            className="cursor-pointer flex min-h-9 w-full rounded-[8px] items-center justify-center gap-2 bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)] transition-all duration-300 hover:bg-[var(--primary-color)] hover:text-white sm:text-xs"
          >
            <ShoppingBag size={14} />
            {t('addToCart')}
          </button>
        </div>
      </div>

      <div className="pb-4 pt-6 w-full min-w-0 overflow-hidden">
        {/* {colorSwatches.length ? (
          <div className="mb-4 flex items-center gap-2">
            {colorSwatches.map((color, index) => (
              <button
                key={`${color.name}-${color.hex}`}
                type="button"
                aria-label={color.name}
                title={color.name}
                onClick={() => setSelectedColorIndex(index)}
                onMouseEnter={() => setSelectedColorIndex(index)}
                className={cn(
                  'size-5 cursor-pointer rounded-full border border-white shadow-[0_0_0_1px_rgba(42,37,37,0.18)] transition-transform hover:scale-110',
                  selectedColorIndex === index && 'shadow-[0_0_0_2px_var(--primary-color)]'
                )}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        ) : null} */}

        <TooltipProvider delay={200}>
          <Tooltip>
            <h3 className="w-full min-w-0">
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    className="block w-full min-w-0 max-w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap border-0 bg-transparent p-0 text-left font-[family-name:var(--font-playfair)] text-base font-semibold leading-tight text-[var(--primary-color)] sm:text-lg"
                  />
                }
              >
                {name}
              </TooltipTrigger>
            </h3>
            <TooltipContent className="bg-[var(--primary-color)] text-white border-0 shadow-md text-xs font-[family-name:var(--font-lora)] px-3 py-2 rounded-md">
              {name}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <p title={description} className="mt-2 text-xs leading-relaxed text-[var(--text-light)] sm:text-sm line-clamp-2">
          {description}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm leading-none sm:mt-3 sm:text-lg">
          <span className="font-semibold text-[var(--primary-color)]">{price}</span>
          {originalPrice ? (
            <span className="text-xs text-[var(--text-light)]/60 line-through sm:text-sm">{originalPrice}</span>
          ) : null}
        </div>
      </div>

      <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen} modal={true}>
        <DialogContent className="h-[60svh] max-h-[60svh] w-[60vw] max-w-[520px] overflow-hidden rounded-lg border border-[var(--bg-secondary)] bg-[var(--bg-main)] p-0 shadow-2xl md:max-w-[680px]">
          <div className="grid max-h-[inherit] min-h-0 grid-cols-1 md:grid-cols-2">
            {/* Left Side: Product Image */}
            <div className="relative h-[20svh] min-h-[110px] bg-[var(--bg-secondary)] md:h-auto md:min-h-0">
              <Image
                src={currentImageSrc}
                alt={imageAlt}
                fill={true}
                sizes="(max-width: 640px) 90vw, 400px"
                className="object-cover"
              />
            </div>
            {/* Right Side: Product Details */}
            <div className="min-h-0 overflow-y-auto p-3 font-[family-name:var(--font-lora)] text-[var(--text-main)] [overscroll-behavior:contain] sm:p-4 md:flex md:flex-col">
              <div className="flex-1">
                <span className="rounded bg-[var(--primary-color)]/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[1.4px] text-[var(--primary-color)] sm:text-[9px]">
                  {t('quickView')}
                </span>
                <DialogHeader className="mt-2 sm:mt-3">
                  <DialogTitle className="font-[family-name:var(--font-playfair)] text-base font-bold leading-tight text-[var(--primary-color)] sm:text-lg">
                    {name}
                  </DialogTitle>
                </DialogHeader>
                
                {/* Price display */}
                <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:mt-3 sm:gap-x-2.5">
                  <span className="text-base font-bold text-[var(--primary-color)] sm:text-lg">{price}</span>
                  {originalPrice && (
                    <span className="text-xs text-[var(--text-light)]/60 line-through sm:text-sm">{originalPrice}</span>
                  )}
                </div>

                <DialogDescription className="mt-2 text-[11px] leading-5 text-[var(--text-light)] line-clamp-2 sm:line-clamp-3">
                  {description}
                </DialogDescription>

                <div className="mt-3 space-y-2.5 sm:space-y-3">
                  {/* Sizes */}
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[1.4px] text-[var(--text-light)] sm:text-[10px]">
                      {t('sizeLabel')}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1.5 sm:mt-1.5">
                      {sizes.length > 0 ? (
                        sizes.map((size) => (
                          <span key={size} className="rounded-sm border border-[var(--bg-secondary)] bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--text-main)] sm:px-2.5 sm:py-1">
                            {size}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-sm border border-[var(--bg-secondary)] bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--text-main)] sm:px-2.5 sm:py-1">
                          Free-size
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Material */}
                  {material && (
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[1.4px] text-[var(--text-light)] sm:text-[10px]">
                        {t('materialLabel')}
                      </span>
                      <p className="mt-0.5 text-xs font-semibold text-[var(--text-main)] sm:mt-1">
                        {materialKeys[material] ? t(`materials.${materialKeys[material]}`) : material}
                      </p>
                    </div>
                  )}

                  {/* Purchase Type */}
                  {purchaseType && (
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[1.4px] text-[var(--text-light)] sm:text-[10px]">
                        {t('purchaseTypeLabel')}
                      </span>
                      <p className="mt-0.5 text-xs font-semibold text-[var(--text-main)] sm:mt-1">
                        {purchaseType === 'ready'
                          ? t('purchaseTypes.readyDescription')
                          : purchaseType === 'custom'
                          ? t('purchaseTypes.customDescription')
                          : purchaseType}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action button */}
              <div className="mt-3 border-t border-[var(--bg-secondary)] pt-2.5 sm:pt-3">
                <button
                  type="button"
                  className="flex min-h-8 w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-[var(--primary-color)] px-3 text-[10px] font-bold uppercase tracking-wider text-white shadow-md transition-all duration-300 hover:bg-[var(--text-main)] sm:min-h-9 sm:text-[11px]"
                >
                  <ShoppingBag size={14} />
                  {t('addToCart')}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export default ProductCard;
