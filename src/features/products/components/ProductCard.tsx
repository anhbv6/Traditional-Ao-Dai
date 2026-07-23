'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

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
  badge?: string;
  colorSwatches?: ProductColorSwatch[];
  sizes?: string[];
  material?: string;
  purchaseType?: string;
  objectFit?: 'cover' | 'contain';
};

function ProductCard({
  imageSrc = '/logoPage.png',
  hoverImageSrc,
  imageAlt = 'Product image',
  name = 'Allen Solly',
  description = 'Women Textured Handheld Bag',
  price = '$80.00',
  originalPrice = '$100.00',
  badge,
  colorSwatches = [],
  sizes = [],
  material,
  purchaseType,
  objectFit,
}: ProductCardProps) {
  const t = useTranslations('Product');
  const fallbackImageSrc = '/logoPage.png';
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? '');
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
        {badge ? (
          <span className="absolute left-3 top-3 bg-[var(--primary-color)] px-3 py-1 text-[10px] font-bold uppercase tracking-[1.6px] text-white shadow-sm">
            {badge}
          </span>
        ) : null}

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

        <div className="absolute inset-x-3 bottom-3 translate-y-0 bg-white/95 p-2 shadow-md transition-all duration-[600ms] ease-out sm:inset-x-5 sm:bottom-5 sm:translate-y-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          {sizes.length ? (
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
          ) : null}
          <button
            type="button"
            className="cursor-pointer flex min-h-9 w-full items-center justify-center gap-2 bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)] transition-all duration-300 hover:bg-[var(--primary-color)] hover:text-white sm:text-xs"
          >
            <ShoppingBag size={14} />
            {t('addToCart')}
          </button>
        </div>
      </div>

      <div className="pb-4 pt-6">
        {colorSwatches.length ? (
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
        ) : null}

        <h3 className="cursor-pointer font-[family-name:var(--font-playfair)] text-base font-semibold leading-tight text-[var(--primary-color)] sm:text-lg">
          {name}
        </h3>
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

      {isQuickViewOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md bg-[var(--bg-main)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[2px] text-[var(--text-light)]">{t('quickView')}</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--primary-color)]">{name}</h3>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsQuickViewOpen(false)}
                className="grid size-9 cursor-pointer place-items-center border border-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--primary-color)] hover:text-white"
              >
                ×
              </button>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--text-light)]">{description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3">
                <dt className="text-xs uppercase tracking-[1.5px] text-[var(--text-light)]">Size</dt>
                <dd className="mt-1 font-semibold text-[var(--text-main)]">{sizes.join(', ') || 'Free-size'}</dd>
              </div>
              <div className="bg-white p-3">
                <dt className="text-xs uppercase tracking-[1.5px] text-[var(--text-light)]">Chất liệu</dt>
                <dd className="mt-1 font-semibold text-[var(--text-main)]">{material ?? 'Lụa cao cấp'}</dd>
              </div>
              <div className="col-span-2 bg-white p-3">
                <dt className="text-xs uppercase tracking-[1.5px] text-[var(--text-light)]">Hình thức</dt>
                <dd className="mt-1 font-semibold text-[var(--text-main)]">{purchaseType ?? 'Có sẵn / May đo'}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default ProductCard;
