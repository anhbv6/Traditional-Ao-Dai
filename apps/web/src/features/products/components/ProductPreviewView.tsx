'use client';

import { useMemo, useState } from 'react';
import { type Locale } from '@repo/shared';
import { cn } from '@/lib/utils';
import ProductGallery from './detail/ProductGallery';
import ProductInfo from './detail/ProductInfo';
import { type DisplayProduct } from '../types/products.types';

export interface ProductPreviewViewProps {
  product: DisplayProduct;
  galleryImages?: string[];
  locale?: Locale;
  /** Thu nhỏ nội dung vừa vặn khi nằm trong modal xem trước */
  compact?: boolean;
  className?: string;
}

/**
 * Component hiển thị chi tiết sản phẩm ở chế độ xem trước (preview/quick view):
 * - Tái sử dụng trọn vẹn ProductGallery và ProductInfo từ storefront.
 * - Chỉ giữ lại các vùng thông tin cần thiết: bộ ảnh sản phẩm, thông tin chính, màu sắc, kích thước và thông số.
 * - Ẩn form số đo, hàng nút giỏ hàng / yêu thích và thanh dính đáy mobile.
 * - Tương tác đổi màu, đổi size và chuyển ảnh vẫn hoạt động mượt mà.
 */
export function ProductPreviewView({
  product,
  galleryImages,
  locale = 'vi',
  compact = true,
  className,
}: ProductPreviewViewProps) {
  const images = useMemo(() => {
    if (galleryImages && galleryImages.length > 0) return galleryImages;
    if (product.galleryImages && product.galleryImages.length > 0) return product.galleryImages;
    const candidates = [
      product.imageSrc,
      product.hoverImageSrc,
      ...product.colors.map((c) => c.imageSrc).filter(Boolean),
    ].filter(Boolean) as string[];
    const set = Array.from(new Set(candidates));
    return set.length > 0 ? set : [product.imageSrc];
  }, [galleryImages, product.galleryImages, product.imageSrc, product.hoverImageSrc, product.colors]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [prevProductId, setPrevProductId] = useState(product.id);

  // Điều chỉnh state trực tiếp trong render khi đổi sản phẩm (chuẩn React 19, không trigger cascading effect)
  if (product.id !== prevProductId) {
    setPrevProductId(product.id);
    setActiveImageIndex(0);
    setSelectedColor(product.colors[0]?.name || '');
    setSelectedSize(product.sizes[0] || '');
  }

  const handleColorSelect = (colorName: string, imageSrc?: string) => {
    setSelectedColor(colorName);
    if (imageSrc) {
      const idx = images.indexOf(imageSrc);
      if (idx !== -1) {
        setActiveImageIndex(idx);
      }
    }
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const selectedPrice = product.sizePrices?.[selectedSize] ?? {
    price: product.priceValue,
    originalPrice: product.originalPriceValue,
  };

  return (
    <div
      style={{
        '--bg-main': '#FAF7F5',
        '--bg-secondary': '#F3ECE7',
        '--bg-card': '#FFFFFF',
        '--primary-color': '#8B1538',
        '--primary-ink': '#2A0A12',
        '--text-main': '#2A0A12',
        '--text-light': '#6E5D62',
        '--border': '#E8DFD8',
      } as React.CSSProperties}
      className={cn(
        'grid grid-cols-1 items-start gap-6 rounded-2xl bg-[#FAF7F5] sm:gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)] lg:gap-8',
        className
      )}
    >
      {/* Cột trái: Bộ sưu tập ảnh sản phẩm (z-30 để bảng zoom nổi lên trên cột thông tin) */}
      <div className="relative z-30 mx-auto w-full max-w-[380px] md:max-w-none">
        <ProductGallery
          galleryImages={images}
          activeImageIndex={activeImageIndex}
          onActiveImageIndexChange={setActiveImageIndex}
          productName={product.name}
          imageAlt={product.imageAlt || product.name}
          defaultImageSrc={product.imageSrc}
          isSticky={false}
          enableZoom={true}
          compact={compact}
        />
      </div>

      {/* Cột phải: Thông tin sản phẩm chi tiết & thông số */}
      <div className="relative z-10 w-full min-w-0">
        <ProductInfo
          product={product}
          locale={locale}
          selectedColor={selectedColor}
          onColorSelect={handleColorSelect}
          selectedSize={selectedSize}
          onSizeSelect={handleSizeSelect}
          selectedPrice={selectedPrice}
          previewMode={true}
          compact={compact}
        />
      </div>
    </div>
  );
}
