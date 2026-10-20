'use client';

import React, { useRef, useState } from 'react';
import { flyToCart } from '@/components/shared/flyToCart';
import ProductGallery from './detail/ProductGallery';
import ProductInfo from './detail/ProductInfo';
import ProductSideTabs, { type ProductSideTabKey } from './detail/ProductSideTabs';
import RelatedProducts from './detail/RelatedProducts';
import { useProductDetail } from '../hooks/useProductDetail';
import { type DisplayProduct, type RelatedProductItem } from '../types/products.types';
import { type Locale } from '@repo/shared';

interface ProductDetailClientProps {
  product: DisplayProduct;
  locale: Locale;
  galleryImages: string[];
  relatedProducts: RelatedProductItem[];
  customMeasurementFields?: Array<{ field_key: string; label: string; placeholder: string; required: boolean }>;
}

export function ProductDetailClient({
  product,
  locale,
  galleryImages,
  relatedProducts,
  customMeasurementFields = [],
}: ProductDetailClientProps) {
  const {
    activeImageIndex,
    setActiveImageIndex,
    selectedColor,
    onColorSelect,
    selectedSize,
    setSelectedSize,
    quantity,
    setQuantity,
    isWishlisted,
    onWishlistToggle,
    customMeasurements,
    onCustomMeasurementChange,
    onAddToCart,
    selectedPrice,
  } = useProductDetail(product, galleryImages, customMeasurementFields);
  const galleryFrameRef = useRef<HTMLDivElement>(null);
  const [sideTab, setSideTab] = useState<ProductSideTabKey>('info');
  const currentImageSrc = galleryImages[activeImageIndex] || product.imageSrc;

  /** Thêm vào giỏ thành công -> ảnh đang xem bay vào icon giỏ trên header */
  const handleAddToCart = () => {
    const added = onAddToCart();
    if (added) flyToCart(currentImageSrc, galleryFrameRef.current);
    return added;
  };

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(380px,1fr)] lg:gap-12">
        {/* Gallery Section */}
        <ProductGallery
          galleryImages={galleryImages}
          activeImageIndex={activeImageIndex}
          onActiveImageIndexChange={setActiveImageIndex}
          productName={product.name}
          imageAlt={product.imageAlt}
          defaultImageSrc={product.imageSrc}
          imageFrameRef={galleryFrameRef}
        />

        {/* Cột cạnh ảnh: tab Thông tin sản phẩm / Đánh giá */}
        <ProductSideTabs
          value={sideTab}
          onValueChange={setSideTab}
          locale={locale}
          infoPanel={
            <ProductInfo
              product={product}
              locale={locale}
              customMeasurementFields={customMeasurementFields}
              selectedColor={selectedColor}
              onColorSelect={onColorSelect}
              selectedSize={selectedSize}
              onSizeSelect={setSelectedSize}
              customMeasurements={customMeasurements}
              onCustomMeasurementChange={onCustomMeasurementChange}
              quantity={quantity}
              onQuantityChange={setQuantity}
              isWishlisted={isWishlisted}
              onWishlistToggle={onWishlistToggle}
              onAddToCart={handleAddToCart}
              currentImageSrc={currentImageSrc}
              selectedPrice={selectedPrice}
              onShowReviews={() => setSideTab('reviews')}
            />
          }
        />
      </div>

      {/* Related Products Section */}
      <RelatedProducts relatedProducts={relatedProducts} title={product.related} />
    </>
  );
}
