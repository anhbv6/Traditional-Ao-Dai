'use client';

import { useState } from 'react';
import type { ComponentProps } from 'react';
import Image from 'next/image';
import { Heart, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ProductColorSwatch = {
  name: string;
  hex: string;
  imageSrc?: string;
};

type ProductHref = ComponentProps<typeof Link>['href'];

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
  productHref?: ProductHref;
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
  objectFit,
  productHref,
}: ProductCardProps) {
  const t = useTranslations('Product');
  const fallbackImageSrc = '/logoPage.png';
  const [isHovered, setIsHovered] = useState(false);
  const selectedColorIndex: number | null = null;
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
            aria-label={t('addToCart')}
            className="cursor-pointer grid size-8 place-items-center rounded-full bg-white text-[var(--text-main)] shadow-sm transition-colors duration-300 hover:bg-[var(--primary-color)] hover:text-white sm:size-10"
          >
            <ShoppingBag size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="pb-4 pt-6 w-full min-w-0 overflow-hidden">
        <TooltipProvider delay={200}>
          <Tooltip>
            <h3 className="w-full min-w-0">
              <TooltipTrigger
                render={
                  <Link
                    href={productHref ?? '/products'}
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
    </article>
  );
}

export default ProductCard;
