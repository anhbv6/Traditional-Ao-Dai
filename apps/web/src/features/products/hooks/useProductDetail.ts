"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type DisplayProduct } from "../types/products.types";

export function useProductDetail(product: DisplayProduct, galleryImages: string[]) {
  const t = useTranslations('Product');
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

  const onColorSelect = (colorName: string, imageSrc?: string) => {
    setSelectedColor(colorName);
    if (imageSrc) {
      const imgIdx = galleryImages.indexOf(imageSrc);
      if (imgIdx !== -1) {
        setActiveImageIndex(imgIdx);
      }
    }
  };

  const onWishlistToggle = () => {
    setIsWishlisted((prev) => !prev);
  };

  const handleAddToCart = () => {
    const isCustomSize = selectedSize.toLowerCase().includes('may đo') || selectedSize.toLowerCase().includes('custom');
    const customMeasurementsStr = isCustomSize && Object.keys(customMeasurements).length > 0
      ? t('details.customMeasurementsPrefix') + Object.entries(customMeasurements)
          .map(([k, v]) => `${k.toUpperCase()}=${v}cm`)
          .join(', ') + '\n'
      : '';

    alert(
      t('details.addedToCart', {
        product: product.name,
        color: selectedColor,
        size: selectedSize,
        quantity: quantity,
      }) + customMeasurementsStr
    );
  };

  return {
    activeImageIndex,
    setActiveImageIndex,
    selectedColor,
    setSelectedColor,
    onColorSelect,
    selectedSize,
    setSelectedSize,
    quantity,
    setQuantity,
    isWishlisted,
    setIsWishlisted,
    onWishlistToggle,
    customMeasurements,
    onCustomMeasurementChange: handleInputChange,
    onAddToCart: handleAddToCart,
  };
}
