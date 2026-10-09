'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { Check, Minus, Plus, Ruler, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Rating, RoundedStar } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
import UseAnimations from 'react-useanimations';
import heart from 'react-useanimations/lib/heart';
import { formatVnd } from '@repo/shared';

import Counter from '@/components/effects/Counter';
import { MAX_LINE_QUANTITY } from '@/features/cart';
import { DisplayProduct } from '../../types/products.types';

interface ProductInfoProps {
  product: DisplayProduct;
  locale: 'vi' | 'en';
  customMeasurementFields: Array<{ field_key: string; label: string; placeholder: string; required: boolean }>;
  selectedColor: string;
  onColorSelect: (colorName: string, imageSrc?: string) => void;
  selectedSize: string;
  onSizeSelect: (size: string) => void;
  customMeasurements: Record<string, string>;
  onCustomMeasurementChange: (fieldKey: string, value: string) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  isWishlisted: boolean;
  onWishlistToggle: () => void;
  /** Trả về `true` khi đã thêm vào giỏ (thiếu số đo -> `false`) */
  onAddToCart: () => boolean;
  /** Giá của size đang chọn (VND) */
  selectedPrice: { price: number; originalPrice?: number };
  /** Ảnh đại diện cho thanh mua nhanh trên mobile */
  currentImageSrc: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;
/** Thời gian giữ trạng thái "Đã thêm" trên nút */
const ADDED_FEEDBACK_MS = 1800;

const ratingStyles = {
  itemShapes: RoundedStar,
  activeFillColor: '#ff9e00',
  inactiveFillColor: '#ffeed6',
};

/** Các khối thông tin hiện lần lượt từ trên xuống khi vào trang */
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export default function ProductInfo({
  product,
  customMeasurementFields = [],
  selectedColor,
  onColorSelect,
  selectedSize,
  onSizeSelect,
  customMeasurements,
  onCustomMeasurementChange,
  quantity,
  onQuantityChange,
  isWishlisted,
  onWishlistToggle,
  onAddToCart,
  selectedPrice,
  locale,
  currentImageSrc,
}: ProductInfoProps) {
  const t = useTranslations('Product');
  const [justAdded, setJustAdded] = useState(false);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionRowRef = useRef<HTMLDivElement>(null);
  // Hàng nút mua đã cuộn QUA phía trên màn hình -> hiện thanh mua nhanh dính đáy (mobile).
  // Không hiện khi trang vừa mở mà hàng nút còn nằm phía dưới.
  const [isPastActionRow, setIsPastActionRow] = useState(false);

  useEffect(() => () => {
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
  }, []);

  useEffect(() => {
    const element = actionRowRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsPastActionRow(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const isCustomSizeSelected = /may đo|custom/i.test(selectedSize);
  const priceText = product.sizePrices ? formatVnd(selectedPrice.price, locale) : product.price;
  const originalPriceText = product.sizePrices
    ? selectedPrice.originalPrice
      ? formatVnd(selectedPrice.originalPrice, locale)
      : null
    : product.originalPrice ?? null;

  const handleAddToCart = () => {
    if (!onAddToCart()) return;
    setJustAdded(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);
  };

  const addButtonContent = (
    <AnimatePresence mode="wait" initial={false}>
      {justAdded ? (
        <motion.span
          key="added"
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="relative flex items-center gap-1.5"
        >
          <Check size={15} strokeWidth={2} />
          {t('addedShort')}
        </motion.span>
      ) : (
        <motion.span
          key="add"
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="relative flex items-center gap-1.5"
        >
          <ShoppingBag size={15} strokeWidth={1.6} />
          {t('addToCart')}
        </motion.span>
      )}
    </AnimatePresence>
  );

  const addButtonClass = `group/add relative flex items-center justify-center overflow-hidden text-xs font-semibold uppercase tracking-[1.5px] text-white transition-colors duration-500 sm:text-[13px] ${
    justAdded ? 'bg-emerald-800' : 'bg-[var(--primary-color)]'
  }`;

  return (
    <div className="min-w-0 lg:pt-1">
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={rise} className="flex items-start justify-between gap-6">
          <h1 className="text-[26px] font-semibold leading-tight text-[var(--primary-color)] sm:text-4xl">{product.name}</h1>
          <span className="mt-1.5 shrink-0 bg-[var(--bg-secondary)] px-3 py-1 text-xs font-semibold text-[var(--primary-color)]">
            {product.stock}
          </span>
        </motion.div>

        <motion.p variants={rise} className="mt-2 text-sm text-[var(--text-main)]">
          {product.description}
        </motion.p>

        <motion.div variants={rise} className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--text-light)]">
          <Rating style={{ maxWidth: 85 }} value={parseFloat(product.rating) || 5} itemStyles={ratingStyles} readOnly />
          <span className="font-semibold text-[var(--text-main)]">{product.rating}</span>
          <span>({product.reviewCount})</span>
        </motion.div>

        {/* Giá: đổi size có giá khác -> giá mới "lăn" lên */}
        <motion.div variants={rise} className="mt-4 flex h-9 items-baseline gap-3 overflow-hidden" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={priceText}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="text-2xl font-semibold text-[var(--primary-color)]"
            >
              {priceText}
            </motion.span>
            {originalPriceText ? (
              <motion.span
                key={`o-${originalPriceText}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-base text-[var(--text-light)]/70 line-through"
              >
                {originalPriceText}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.div>

        <motion.p variants={rise} className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-main)]">
          {product.longDescription}
        </motion.p>

        {/* Màu sắc: khung viền trượt theo màu đang chọn */}
        {product.colors.length > 0 ? (
          <motion.div variants={rise} className="mt-6">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">
              {t('details.color')}: <span className="font-normal text-[var(--text-light)]">{selectedColor}</span>
            </h2>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {product.colors.map((color) => {
                const isActive = selectedColor === color.name;
                return (
                  <button
                    key={color.name}
                    type="button"
                    title={color.name}
                    aria-label={color.name}
                    aria-pressed={isActive}
                    onClick={() => onColorSelect(color.name, color.imageSrc)}
                    className="relative grid size-9 cursor-pointer place-items-center"
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="product-color-ring"
                        className="absolute inset-0 border-2 border-[var(--primary-color)]"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    ) : null}
                    <span
                      className="size-6 border border-black/10 transition-transform duration-300 hover:scale-110"
                      style={{ backgroundColor: color.hex }}
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}

        {/* Kích thước: nền đỏ đô trượt sang size đang chọn */}
        {product.sizes.length > 0 ? (
          <motion.div variants={rise} className="mt-6">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">{t('details.size')}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((size) => {
                const isActive = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onSizeSelect(size)}
                    className={`relative h-9 min-w-9 cursor-pointer border px-3 text-xs font-semibold transition-colors duration-300 ${
                      isActive
                        ? 'border-[var(--primary-color)] text-white'
                        : 'border-[var(--border)] text-[var(--text-main)] hover:border-[var(--primary-color)]'
                    }`}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="product-size-fill"
                        className="absolute inset-0 bg-[var(--primary-color)]"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <span className="relative">{size}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </motion.div>

      {/* Form số đo: mở ra mượt khi chọn size may đo, ô nhập hiện lần lượt */}
      <AnimatePresence initial={false}>
        {isCustomSizeSelected && customMeasurementFields.length > 0 ? (
          <motion.div
            key="measurements"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-6 border border-[var(--border)] border-l-2 border-l-[var(--primary-color)] bg-[var(--bg-secondary)] p-4">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary-color)]">
                <Ruler size={14} strokeWidth={1.6} />
                {t('details.enterMeasurements')}
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {customMeasurementFields.map((field, index) => (
                  <motion.label
                    key={field.field_key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 + index * 0.05, ease: EASE }}
                    className="flex flex-col"
                  >
                    <span className="mb-1 text-[10px] font-semibold text-[var(--text-main)]">
                      {field.label}
                      {field.required ? <span className="text-[var(--primary-color)]"> *</span> : null}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={customMeasurements[field.field_key] || ''}
                      onChange={(e) => onCustomMeasurementChange(field.field_key, e.target.value)}
                      className="h-9 border border-[var(--border)] bg-[var(--bg-main)] px-2 text-[12px] outline-none transition-colors focus:border-[var(--primary-color)]"
                    />
                  </motion.label>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Hàng mua: số lượng + thêm vào giỏ + yêu thích */}
      <motion.div
        ref={actionRowRef}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.75, ease: EASE }}
        className="mt-8 flex w-full flex-row items-center gap-2 sm:gap-3"
      >
        <div className="flex h-11 w-[30%] items-center justify-between border border-[var(--border)] bg-[var(--bg-main)] px-1.5 sm:h-12 sm:w-32 sm:px-3">
          <button
            type="button"
            aria-label={t('quantity.decrease')}
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="cursor-pointer p-1 text-[var(--text-main)] transition-colors hover:text-[var(--primary-color)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
          <div className="flex min-w-[1.25rem] items-center justify-center text-center font-semibold text-[var(--text-main)] select-none sm:min-w-[2rem]">
            <Counter
              value={quantity}
              fontSize={14}
              padding={1}
              textColor="var(--text-main)"
              gradientFrom="var(--bg-main)"
              gradientTo="transparent"
              gradientHeight={2}
              fontWeight="600"
              counterStyle={{ fontFamily: "var(--font-lora), 'Lora', serif" }}
            />
          </div>
          <button
            type="button"
            aria-label={t('quantity.increase')}
            onClick={() => onQuantityChange(Math.min(MAX_LINE_QUANTITY, quantity + 1))}
            disabled={quantity >= MAX_LINE_QUANTITY}
            className="cursor-pointer p-1 text-[var(--text-main)] transition-colors hover:text-[var(--primary-color)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>

        <motion.button type="button" onClick={handleAddToCart} whileTap={{ scale: 0.97 }} className={`h-11 flex-1 sm:h-12 ${addButtonClass}`}>
          <span
            aria-hidden="true"
            className="absolute inset-0 origin-left scale-x-0 bg-[#2A0A12] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/add:scale-x-100"
          />
          {addButtonContent}
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          aria-label={isWishlisted ? t('removeFromWishlist') : t('addToWishlist')}
          aria-pressed={isWishlisted}
          onClick={onWishlistToggle}
          className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border transition-colors duration-300 sm:h-12 sm:w-12 ${
            isWishlisted ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-[var(--border)] text-[var(--text-main)] hover:border-[var(--primary-color)]'
          }`}
        >
          <UseAnimations animation={heart} size={20} reverse={isWishlisted} strokeColor="currentColor" fillColor="currentColor" />
        </motion.button>
      </motion.div>

      {/* Thông số */}
      <motion.dl
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="mt-6 grid gap-2 border-t border-[var(--border)] pt-5 text-sm text-[var(--text-light)] sm:grid-cols-2"
      >
        <div>
          <dt className="inline font-semibold text-[var(--text-main)]">{t('details.sku')}:</dt> <dd className="inline">{product.id}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-main)]">{t('details.category')}:</dt> <dd className="inline">{product.category}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-main)]">{t('materialLabel')}:</dt> <dd className="inline">{product.material}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--text-main)]">{t('purchaseTypeLabel')}:</dt>{' '}
          <dd className="inline">{t(`purchaseTypes.${product.purchaseType}`)}</dd>
        </div>
      </motion.dl>

      {/* Thanh mua nhanh dính đáy (mobile/tablet) khi hàng nút đã cuộn khỏi màn hình */}
      <AnimatePresence>
        {isPastActionRow ? (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.45, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-[var(--border)] bg-white/95 px-4 py-2.5 shadow-[0_-12px_28px_-16px_rgba(42,37,37,0.35)] backdrop-blur-sm lg:hidden"
          >
            <span className="relative aspect-[3/4] w-9 shrink-0 overflow-hidden bg-[var(--bg-secondary)]">
              <Image src={currentImageSrc} alt="" fill sizes="36px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--font-playfair)] text-[13px] font-semibold text-[var(--text-main)]">{product.name}</p>
              <p className="truncate text-[11px] text-[var(--text-light)]">
                <span className="font-semibold text-[var(--primary-color)]">{priceText}</span>
                {selectedSize ? ` · ${t('sizeLabel')} ${selectedSize}` : ''}
              </p>
            </div>
            <motion.button type="button" onClick={handleAddToCart} whileTap={{ scale: 0.96 }} className={`h-10 shrink-0 px-4 ${addButtonClass}`}>
              {addButtonContent}
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
