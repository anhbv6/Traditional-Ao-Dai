'use client';

import React from 'react';
import ProductGallery from './detail/ProductGallery';
import ProductInfo from './detail/ProductInfo';
import ProductTabs from './detail/ProductTabs';
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
  } = useProductDetail(product, galleryImages);

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)] lg:gap-12">
        {/* Gallery Section */}
        <ProductGallery
          galleryImages={galleryImages}
          activeImageIndex={activeImageIndex}
          onActiveImageIndexChange={setActiveImageIndex}
          productName={product.name}
          imageAlt={product.imageAlt}
          defaultImageSrc={product.imageSrc}
        />

        {/* Info & Configurations Section */}
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
          onAddToCart={onAddToCart}
        />
      </div>

      {/* Product Detail Tabs */}
      <ProductTabs product={product} locale={locale} />

      {/* Related Products Section */}
      <RelatedProducts relatedProducts={relatedProducts} title={product.related} />
    </>
  );
}
