'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Heart, Scissors, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { parseVndString, useCartStore } from '@/features/cart';
import { useIsWishlisted, useWishlistStore } from '@/features/wishlist';
import { showToast } from '@/components/ui/toast';
import { flyToCart } from '@/components/shared/flyToCart';
import { materialKeys } from './FilterSidebar';

export type ProductColorSwatch = {
  name: string;
  hex: string;
  imageSrc?: string;
};

/** Dùng chung cho Link ở tiêu đề và router.push khi bấm thẻ (kiểu của router hẹp hơn Link) */
type ProductHref = Parameters<ReturnType<typeof useRouter>['push']>[0];

type ProductCardProps = {
  imageSrc?: string;
  hoverImageSrc?: string;
  imageAlt?: string;
  name?: string;
  description?: string;
  /** Giá đã định dạng để hiển thị */
  price?: string;
  /** Giá số nguyên VND dùng cho giỏ hàng (bắt buộc khi có dữ liệu thật từ API) */
  priceValue?: number;
  /** Slug sản phẩm — khóa nhận diện trong giỏ hàng */
  slug?: string;
  originalPrice?: string;
  /** Giá gốc số nguyên VND (dùng cho danh sách yêu thích) */
  originalPriceValue?: number;
  colorSwatches?: ProductColorSwatch[];
  sizes?: string[];
  material?: string;
  purchaseType?: string;
  objectFit?: 'cover' | 'contain';
  productHref?: ProductHref;
};

const MAX_SWATCHES = 4;

/**
 * Thẻ sản phẩm kiểu tạp chí: ảnh dọc chiếm trọn thẻ, chữ tối giản bên dưới (tên — chất liệu — giá + màu).
 * Rê chuột (desktop): ảnh phụ mờ dần vào, dải "Thêm vào giỏ" trượt lên từ đáy ảnh.
 * Mobile: nút yêu thích / giỏ hàng luôn hiện dạng icon nhỏ ở góc ảnh.
 */
export function ProductCard({
  imageSrc = '/logoPage.png',
  hoverImageSrc,
  imageAlt = 'Product image',
  name = '',
  description,
  price = '',
  priceValue,
  slug,
  originalPrice,
  originalPriceValue,
  colorSwatches = [],
  sizes = [],
  material,
  purchaseType,
  objectFit,
  productHref,
}: ProductCardProps) {
  const t = useTranslations('Product');
  const fallbackImageSrc = '/logoPage.png';
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const [hoverImageFailed, setHoverImageFailed] = useState(false);
  const currentImageSrc = failedImageSrc === imageSrc ? fallbackImageSrc : imageSrc;
  const isPlaceholder = currentImageSrc === fallbackImageSrc;
  const fitMode = objectFit ?? (isPlaceholder ? 'contain' : 'cover');
  // Ảnh phụ được tải sẵn và xếp chồng lên ảnh chính; rê chuột chỉ làm mờ dần (không đổi src -> không nháy / giật)
  const showHoverImage = Boolean(hoverImageSrc) && !hoverImageFailed && !isPlaceholder;
  const imageClassName = `transition-[opacity,transform] duration-[1200ms,1800ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-[1.03] ${
    fitMode === 'cover' ? 'object-cover' : 'object-contain px-8 py-10 sm:px-10'
  }`;
  const imageSizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 300px';

  const router = useRouter();
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const targetHref = productHref ?? '/products';

  /**
   * Bấm vào bất kỳ đâu trên thẻ -> sang trang chi tiết.
   * Bỏ qua khi bấm vào link (tiêu đề đã tự điều hướng) hoặc nút (yêu thích / giỏ hàng).
   */
  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    router.push(targetHref);
  };

  // Dòng phụ dưới tên: ưu tiên chất liệu (ngắn, dễ so sánh), không có thì dùng mô tả
  const subline = material ? (materialKeys[material] ? t(`materials.${materialKeys[material]}`) : material) : description;
  const itemSlug = slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  // Giỏ hàng / yêu thích lưu số nguyên VND; dữ liệu mock hiện chỉ có chuỗi giá đã định dạng
  const itemPrice = priceValue ?? parseVndString(price);
  const isWishlisted = useIsWishlisted(itemSlug);

  const isCustom = purchaseType === 'custom';

  /**
   * Thêm nhanh: hàng may sẵn -> size M (hoặc size đầu tiên nếu không có M);
   * hàng may đo -> sang trang chi tiết để nhập số đo (không thêm thẳng vào giỏ).
   */
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCustom) {
      router.push(targetHref);
      return;
    }

    const size = sizes.includes('M') ? 'M' : (sizes[0] ?? 'M');
    useCartStore.getState().addItem({
      name,
      slug: itemSlug,
      image: currentImageSrc,
      price: itemPrice,
      originalPrice: originalPriceValue,
      size,
    });
    flyToCart(currentImageSrc, imageFrameRef.current);
    showToast.success(t('cartAdded'), `${name} · ${t('sizeLabel')} ${size}`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    useWishlistStore.getState().toggle({
      slug: itemSlug,
      name,
      image: imageSrc,
      price: itemPrice,
      originalPrice: originalPriceValue,
      subline: subline || undefined,
      purchaseType: purchaseType === 'custom' ? 'custom' : 'ready',
    });
  };

  const extraSwatches = colorSwatches.length - MAX_SWATCHES;

  return (
    <article
      className="group w-full cursor-pointer font-[family-name:var(--font-lora)] text-[var(--text-main)]"
      onMouseEnter={() => router.prefetch(targetHref)}
      onClick={handleCardClick}
    >
      <div ref={imageFrameRef} className="relative aspect-[3/4] overflow-hidden bg-[var(--bg-secondary)]">
        <Image
          src={currentImageSrc}
          alt={imageAlt}
          fill
          sizes={imageSizes}
          className={imageClassName}
          onError={() => setFailedImageSrc(imageSrc)}
        />
        {showHoverImage ? (
          <Image
            src={hoverImageSrc as string}
            alt=""
            aria-hidden="true"
            fill
            sizes={imageSizes}
            className={`opacity-0 group-hover:opacity-100 ${imageClassName}`}
            onError={() => setHoverImageFailed(true)}
          />
        ) : null}

        {originalPrice ? (
          <span className="absolute left-0 top-3 bg-[var(--primary-color)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-white">
            {t('sale')}
          </span>
        ) : null}

        <div
          className={`absolute right-2.5 top-2.5 flex flex-col gap-2 transition-opacity duration-500 lg:group-hover:opacity-100 ${
            isWishlisted ? '' : 'lg:opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-pressed={isWishlisted}
            aria-label={isWishlisted ? t('removeFromWishlist') : t('addToWishlist')}
            className={`grid size-8 cursor-pointer place-items-center backdrop-blur-sm transition-colors duration-300 active:scale-90 sm:size-9 ${
              isWishlisted
                ? 'bg-[var(--primary-color)] text-white'
                : 'bg-white/90 text-[var(--text-main)] hover:bg-[var(--primary-color)] hover:text-white'
            }`}
          >
            <Heart
              size={15}
              strokeWidth={1.6}
              fill={isWishlisted ? 'currentColor' : 'none'}
              className={`transition-transform duration-300 ${isWishlisted ? 'scale-110' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={isCustom ? t('customTailor') : t('addToCart')}
            className="grid size-8 cursor-pointer place-items-center bg-white/90 text-[var(--text-main)] backdrop-blur-sm transition-colors duration-300 hover:bg-[var(--primary-color)] hover:text-white active:scale-90 sm:size-9 lg:hidden"
          >
            <ShoppingBag size={15} strokeWidth={1.6} />
          </button>
        </div>

        {/* Desktop: dải thêm vào giỏ trượt lên khi rê chuột */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="absolute inset-x-0 bottom-0 hidden min-h-11 translate-y-full cursor-pointer items-center justify-center gap-2.5 bg-white/95 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-main)] backdrop-blur-sm transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--primary-color)] hover:text-white focus-visible:translate-y-0 group-hover:translate-y-0 lg:flex"
        >
          {isCustom ? <Scissors size={14} strokeWidth={1.6} /> : <ShoppingBag size={14} strokeWidth={1.6} />}
          {isCustom ? t('customTailor') : t('addToCart')}
        </button>
      </div>

      <div className="pt-4">
        <h3 className="min-w-0">
          <Link
            href={targetHref}
            title={name}
            className="block truncate font-[family-name:var(--font-playfair)] text-[15px] font-semibold leading-snug text-[var(--text-main)] transition-colors hover:text-[var(--primary-color)] sm:text-[17px]"
          >
            {name}
          </Link>
        </h3>
        {subline ? <p className="mt-1 truncate text-xs text-[var(--text-light)] sm:text-[13px]">{subline}</p> : null}

        {/* Giá + màu: trên thẻ hẹp (mobile 2 cột) dải màu tự xuống dòng thay vì ép giá gốc xuống dưới */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:mt-2.5">
          <p className="flex items-baseline gap-x-1.5 whitespace-nowrap text-[13px] sm:gap-x-2 sm:text-[15px]">
            <span className="font-semibold text-[var(--primary-color)]">{price}</span>
            {originalPrice ? <span className="text-[11px] text-[var(--text-light)]/70 line-through sm:text-xs">{originalPrice}</span> : null}
          </p>
          {colorSwatches.length > 0 ? (
            <ul className="flex shrink-0 items-center gap-1" aria-label={t('colorsLabel')}>
              {colorSwatches.slice(0, MAX_SWATCHES).map((swatch) => (
                <li key={swatch.name} title={swatch.name} className="size-2.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: swatch.hex }} />
              ))}
              {extraSwatches > 0 ? <li className="ml-0.5 text-[10px] text-[var(--text-light)]">+{extraSwatches}</li> : null}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}
