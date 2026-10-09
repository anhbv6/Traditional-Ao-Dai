"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/features/cart";
import { useIsWishlisted, useWishlistStore } from "@/features/wishlist";
import { showToast } from "@/components/ui/toast";
import { type DisplayProduct } from "../types/products.types";
import { type MeasurementField } from "../data/detailMockProduct";

export function useProductDetail(
  product: DisplayProduct,
  galleryImages: string[],
  measurementFields: MeasurementField[] = []
) {
  const t = useTranslations('Product');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [quantity, setQuantity] = useState(1);
  const isWishlisted = useIsWishlisted(product.slug);
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
    useWishlistStore.getState().toggle({
      slug: product.slug,
      name: product.name,
      image: product.imageSrc,
      price: product.priceValue,
      originalPrice: product.originalPriceValue,
      subline: product.material,
      purchaseType: product.purchaseType === "custom" ? "custom" : "ready",
    });
  };

  const isCustomSize = /may đo|custom/i.test(selectedSize);
  // Giá theo size đang chọn (size may đo có giá riêng); không có bảng giá theo size thì dùng giá chung
  const selectedPrice = product.sizePrices?.[selectedSize] ?? {
    price: product.priceValue,
    originalPrice: product.originalPriceValue,
  };

  /**
   * Thêm biến thể đang chọn vào giỏ (màu + size + số lượng; size may đo kèm số đo).
   * Số đo bắt buộc phải điền đủ và là số dương — thiếu thì báo lỗi, không thêm.
   * Trả về `true` khi đã thêm (để giao diện chạy hiệu ứng "bay vào giỏ").
   */
  const handleAddToCart = (): boolean => {
    let measurements: Record<string, string> | undefined;

    if (isCustomSize && measurementFields.length > 0) {
      const missing = measurementFields.some((field) => {
        const value = Number(customMeasurements[field.field_key]);
        return field.required && !(value > 0);
      });
      if (missing) {
        showToast.error(t('details.measurementsRequired'));
        return false;
      }
      measurements = Object.fromEntries(
        measurementFields
          .filter((field) => Number(customMeasurements[field.field_key]) > 0)
          .map((field) => [field.label, customMeasurements[field.field_key]])
      );
    }

    const colorImage = product.colors.find((color) => color.name === selectedColor)?.imageSrc;

    useCartStore.getState().addItem({
      name: product.name,
      slug: product.slug,
      image: colorImage || product.imageSrc,
      price: selectedPrice.price,
      originalPrice: selectedPrice.originalPrice,
      size: selectedSize,
      color: selectedColor || undefined,
      measurements,
      quantity,
    });

    showToast.success(
      t('cartAdded'),
      [product.name, selectedColor, `${t('sizeLabel')} ${selectedSize}`, `×${quantity}`].filter(Boolean).join(' · ')
    );
    return true;
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
    onWishlistToggle,
    customMeasurements,
    onCustomMeasurementChange: handleInputChange,
    selectedPrice,
    onAddToCart: handleAddToCart,
  };
}
