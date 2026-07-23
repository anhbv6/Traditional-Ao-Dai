'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, Heart, Repeat2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

type ProductCardProps = {
  imageSrc?: string;
  imageAlt?: string;
  name?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  objectFit?: 'cover' | 'contain';
};

function ProductCard({
  imageSrc = '/logoPage.png',
  imageAlt = 'Product image',
  name = 'Allen Solly',
  description = 'Women Textured Handheld Bag',
  price = '$80.00',
  originalPrice = '$100.00',
  objectFit,
}: ProductCardProps) {
  const t = useTranslations('Product');
  const fallbackImageSrc = '/logoPage.png';
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const currentImageSrc = failedImageSrc === imageSrc ? fallbackImageSrc : imageSrc;
  const isPlaceholder = currentImageSrc === fallbackImageSrc;
  const fitMode = objectFit ?? (isPlaceholder ? 'contain' : 'cover');
  const imageClassName = `transition-transform duration-[800ms] cubic-bezier(0.25, 1, 0.5, 1) group-hover:scale-[1.04] ${
    fitMode === 'cover' ? 'object-cover' : 'object-contain px-8 py-10 sm:px-10'
  }`;

  return (
    <article className="group w-full max-w-[380px] overflow-hidden font-[family-name:var(--font-lora)] text-[var(--text-main)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-secondary)]">
        <Image
          src={currentImageSrc}
          alt={imageAlt}
          fill={true}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 44vw, 380px"
          className={imageClassName}
          onError={() => setFailedImageSrc(imageSrc)}
        />
        <div className="absolute right-2 top-3 flex translate-x-0 flex-col gap-2 opacity-100 transition-all duration-[600ms] ease-out sm:right-5 sm:top-7 sm:gap-3 sm:translate-x-3 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
          <button
            type="button"
            aria-label={t('addToWishlist')}
            className="cursor-pointer grid size-8 place-items-center rounded-full bg-white text-[var(--text-main)] shadow-sm transition-colors duration-300 hover:bg-[var(--primary-color)] hover:text-white sm:size-10"
          >
            <Heart size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={t('compare')}
            className="cursor-pointer grid size-8 place-items-center rounded-full bg-white text-[var(--text-main)] shadow-sm transition-colors duration-300 hover:bg-[var(--primary-color)] hover:text-white sm:size-10"
          >
            <Repeat2 size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={t('quickView')}
            className="cursor-pointer grid size-8 place-items-center rounded-full bg-white text-[var(--text-main)] shadow-sm transition-colors duration-300 hover:bg-[var(--primary-color)] hover:text-white sm:size-10"
          >
            <Eye size={16} strokeWidth={2} />
          </button>
        </div>

        <button
          type="button"
          className="cursor-pointer absolute inset-x-3 bottom-3 min-h-8 translate-y-0 rounded-md bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)] shadow-md transition-all duration-[600ms] ease-out hover:bg-[var(--primary-color)] hover:text-white sm:inset-x-8 sm:bottom-6 sm:min-h-11 sm:translate-y-4 sm:text-xs sm:px-5 sm:tracking-[2px] sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
        >
          {t('addToCart')}
        </button>
      </div>

      <div className="pb-4 pt-6">
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
    </article>
  );
}

export default ProductCard;
