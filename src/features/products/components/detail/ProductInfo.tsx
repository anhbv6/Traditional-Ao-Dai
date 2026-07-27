'use client';

import { Star, Minus, Plus, ShoppingBag, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import Counter from '@/components/Counter';
import { DisplayProduct } from '../ProductDetailClient';

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
  onAddToCart: () => void;
}

export default function ProductInfo({
  product,
  locale,
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
}: ProductInfoProps) {
  const t = useTranslations('Product');

  const isCustomSizeSelected =
    selectedSize.toLowerCase().includes('may đo') || selectedSize.toLowerCase().includes('custom');

  return (
    <div className="min-w-0 lg:pt-1">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--primary-color)] sm:text-4xl">{product.name}</h1>
        </div>
        <span className="shrink-0 bg-[var(--bg-secondary)] px-3 py-1 text-xs font-semibold text-[var(--primary-color)]">
          {product.stock}
        </span>
      </div>

      <p className="mt-2 text-sm text-[var(--text-main)]">{product.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--text-light)]">
        <span className="flex items-center gap-0.5 text-[#FFC107]">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} size={17} fill="currentColor" strokeWidth={0} />
          ))}
        </span>
        <span className="font-semibold text-[var(--text-main)]">{product.rating}</span>
        <span>({product.reviewCount})</span>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-[var(--primary-color)]">{product.price}</span>
        {product.originalPrice ? (
          <span className="text-base text-[var(--text-light)]/70 line-through">{product.originalPrice}</span>
        ) : null}
      </div>

      <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-main)]">{product.longDescription}</p>

      {/* Color Switch Swatches */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-[var(--text-main)]">
          {product.colors.length > 0 ? (locale === 'vi' ? 'Màu sắc' : 'Colors') : ''}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.colors.map((color) => (
            <button
              key={color.name}
              type="button"
              title={color.name}
              aria-label={color.name}
              onClick={() => onColorSelect(color.name, color.imageSrc)}
              className={`size-8 cursor-pointer border rounded-[4px] transition-transform hover:scale-105 ${
                selectedColor === color.name
                  ? 'border-[var(--primary-color)] ring-2 ring-[var(--primary-color)]/20'
                  : 'border-[var(--border)]'
              }`}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      </div>

      {/* Size Select Swatches */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-[var(--text-main)]">
          {product.sizes.length > 0 ? (locale === 'vi' ? 'Kích thước' : 'Sizes') : ''}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onSizeSelect(size)}
              className={`h-9 min-w-9 cursor-pointer border px-3 text-xs font-semibold transition-colors ${
                selectedSize === size
                  ? 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white'
                  : 'border-[var(--border)] bg-transparent text-[var(--text-main)] hover:border-[var(--primary-color)]'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Sliding Custom Measurement form if size is Custom */}
      {isCustomSizeSelected && customMeasurementFields.length > 0 && (
        <div className="mt-6 bg-[var(--bg-secondary)] border border-[var(--border)] p-4 transition-all duration-300">
          <h4 className="text-xs font-bold text-[var(--primary-color)] uppercase tracking-wider mb-3">
            {locale === 'vi' ? 'Nhập số đo của bạn (cm)' : 'Enter your measurements (cm)'}
          </h4>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {customMeasurementFields.map((field) => (
              <div key={field.field_key} className="flex flex-col">
                <label className="text-[10px] font-semibold text-[var(--text-main)] mb-1">{field.label}</label>
                <input
                  type="number"
                  placeholder={field.placeholder}
                  required={field.required}
                  value={customMeasurements[field.field_key] || ''}
                  onChange={(e) => onCustomMeasurementChange(field.field_key, e.target.value)}
                  className="h-8 border border-[var(--border)] bg-[var(--bg-main)] px-2 text-[11px] outline-none focus:border-[var(--primary-color)]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Row: Quantity + Add to Cart + Wishlist */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex h-12 w-full rounded-[4px] items-center justify-between border border-[var(--border)] bg-[var(--bg-main)] px-4 sm:w-32">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="cursor-pointer text-[var(--text-main)] p-1"
          >
            <Minus size={16} />
          </button>
          <div className="flex items-center justify-center font-semibold select-none text-[var(--text-main)] min-w-[2rem] text-center">
            <Counter
              value={quantity}
              fontSize={16}
              padding={2}
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
            aria-label="Increase quantity"
            onClick={() => onQuantityChange(quantity + 1)}
            className="cursor-pointer text-[var(--text-main)] p-1"
          >
            <Plus size={16} />
          </button>
        </div>
        <Button
          className="h-12 flex-1 rounded-[4px] bg-[var(--primary-color)] text-white hover:bg-[var(--accent-color)]"
          onClick={onAddToCart}
        >
          <ShoppingBag size={17} />
          {t('addToCart')}
        </Button>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={t('addToWishlist')}
          className={`h-12 w-full rounded-none border-[var(--border)] bg-transparent transition-colors sm:w-12 hover:border-[var(--primary-color)] ${
            isWishlisted ? 'text-[var(--primary-color)] border-[var(--primary-color)]' : 'text-[var(--text-main)]'
          }`}
          onClick={onWishlistToggle}
        >
          <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
        </Button>
      </div>

      {/* Product Meta Specifications */}
      <div className="mt-6 grid gap-2 border-t border-[var(--border)] pt-5 text-sm text-[var(--text-light)] sm:grid-cols-2">
        <p>
          <span className="font-semibold text-[var(--text-main)]">{product.sku}:</span> {product.id}
        </p>
        <p>
          <span className="font-semibold text-[var(--text-main)]">
            {locale === 'vi' ? 'Danh mục:' : 'Category:'}
          </span>{' '}
          {product.category}
        </p>
        <p>
          <span className="font-semibold text-[var(--text-main)]">{t('materialLabel')}:</span> {product.material}
        </p>
        <p>
          <span className="font-semibold text-[var(--text-main)]">{t('purchaseTypeLabel')}:</span>{' '}
          {t(`purchaseTypes.${product.purchaseType}`)}
        </p>
      </div>
    </div>
  );
}
