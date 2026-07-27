'use client';

import { useState } from 'react';

import ProductGallery from './detail/ProductGallery';
import ProductInfo from './detail/ProductInfo';
import ProductTabs from './detail/ProductTabs';
import RelatedProducts from './detail/RelatedProducts';

export interface DisplayColor {
  name: string;
  hex: string;
  imageSrc?: string;
}

export interface DisplayProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageSrc: string;
  hoverImageSrc: string;
  imageAlt: string;
  category: string;
  purchaseType: string;
  material: string;
  sizes: string[];
  colors: DisplayColor[];
  longDescription: string;
  secondaryDescription: string;
  rating: string;
  reviewCount: string;
  stock: string;
  sku: string;
  related: string;
}

export interface RelatedProductItem {
  id: string;
  imageSrc: string;
  hoverImageSrc: string;
  imageAlt: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  colors: DisplayColor[];
  sizes: string[];
  material: string;
  purchaseType: string;
}

interface ProductDetailClientProps {
  product: DisplayProduct;
  locale: 'vi' | 'en';
  galleryImages: string[];
  relatedProducts: RelatedProductItem[];
  customMeasurementFields?: Array<{ field_key: string; label: string; placeholder: string; required: boolean }>;
}

export default function ProductDetailClient({
  product,
  locale,
  galleryImages,
  relatedProducts,
  customMeasurementFields = [],
}: ProductDetailClientProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [customMeasurements, setCustomMeasurements] = useState<Record<string, string>>({});

  const handleInputChange = (fieldKey: string, value: string) => {
    setCustomMeasurements((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleAddToCart = () => {
    const isCustomSize = selectedSize.toLowerCase().includes('may đo') || selectedSize.toLowerCase().includes('custom');
    const details = {
      product: product.name,
      color: selectedColor,
      size: selectedSize,
      quantity,
      customMeasurements: isCustomSize ? customMeasurements : null,
    };

    alert(
      locale === 'vi'
        ? `🛒 ĐÃ THÊM VÀO GIỎ HÀNG!\n\n` +
          `• Sản phẩm: ${details.product}\n` +
          `• Màu sắc: ${details.color}\n` +
          `• Kích thước: ${details.size}\n` +
          `• Số lượng: ${details.quantity}\n` +
          (details.customMeasurements && Object.keys(details.customMeasurements).length > 0
            ? `• Số đo may đo: ${Object.entries(details.customMeasurements)
                .map(([k, v]) => `${k.toUpperCase()}=${v}cm`)
                .join(', ')}\n`
            : '')
        : `🛒 ADDED TO CART!\n\n` +
          `• Product: ${details.product}\n` +
          `• Color: ${details.color}\n` +
          `• Size: ${details.size}\n` +
          `• Quantity: ${details.quantity}\n` +
          (details.customMeasurements && Object.keys(details.customMeasurements).length > 0
            ? `• Custom Measurements: ${Object.entries(details.customMeasurements)
                .map(([k, v]) => `${k.toUpperCase()}=${v}cm`)
                .join(', ')}\n`
            : '')
    );
  };

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
          onColorSelect={(colorName, imageSrc) => {
            setSelectedColor(colorName);
            if (imageSrc) {
              const imgIdx = galleryImages.indexOf(imageSrc);
              if (imgIdx !== -1) {
                setActiveImageIndex(imgIdx);
              }
            }
          }}
          selectedSize={selectedSize}
          onSizeSelect={setSelectedSize}
          customMeasurements={customMeasurements}
          onCustomMeasurementChange={handleInputChange}
          quantity={quantity}
          onQuantityChange={setQuantity}
          isWishlisted={isWishlisted}
          onWishlistToggle={() => setIsWishlisted(!isWishlisted)}
          onAddToCart={handleAddToCart}
        />
      </div>

      {/* Product Detail Tabs */}
      <ProductTabs product={product} locale={locale} />

      {/* Related Products Section */}
      <RelatedProducts relatedProducts={relatedProducts} title={product.related} />
    </>
  );
}
