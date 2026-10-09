import React from 'react';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from './ProductDetailClient';
import { type DisplayProduct, type RelatedProductItem } from '../types/products.types';
import { parseVndString } from '@/features/cart';
import { productCatalog } from '../data/mockProducts';
import { mockDetailProducts } from '../data/detailMockProduct';
import { type MeasurementField } from '../data/detailMockProduct';

interface ProductDetailProps {
  slug: string;
  locale: 'vi' | 'en';
}

export function ProductDetail({ slug, locale }: ProductDetailProps) {
  let displayProduct: DisplayProduct;
  let galleryImages: string[] = [];
  let relatedProducts: RelatedProductItem[] = [];
  let customMeasurementFields: MeasurementField[] = [];

  if (slug in mockDetailProducts) {
    const mock = mockDetailProducts[slug];

    galleryImages = mock.gallery.map(item => item.url);
    customMeasurementFields = mock.custom_measurement_fields;

    const baseVariant = mock.variants[0];
    // Giá theo size: lấy biến thể có hình thức mua cơ bản (giá không phụ thuộc màu)
    const basePurchaseType = mock.options.find(o => o.code === 'purchase_type')?.values[0]?.id;
    const sizePrices = Object.fromEntries(
      (mock.options.find(o => o.code === 'size')?.values ?? []).map(sizeValue => {
        const variant = mock.variants.find(
          v => v.options_combination.size === sizeValue.id && v.options_combination.purchase_type === basePurchaseType
        );
        return [
          sizeValue.label,
          { price: variant?.price ?? baseVariant.price, originalPrice: variant?.compare_at_price ?? undefined },
        ];
      })
    );

    displayProduct = {
      id: mock.id,
      slug: mock.slug,
      name: mock.name,
      description: mock.short_description,
      price: baseVariant.price.toLocaleString('vi-VN') + 'đ',
      priceValue: baseVariant.price,
      originalPriceValue: baseVariant.compare_at_price || undefined,
      sizePrices,
      originalPrice: baseVariant.compare_at_price
        ? baseVariant.compare_at_price.toLocaleString('vi-VN') + 'đ'
        : undefined,
      imageSrc: mock.gallery[0].url,
      hoverImageSrc: mock.gallery[1]?.url || mock.gallery[0].url,
      imageAlt: mock.gallery[0].alt || mock.name,
      category: mock.seo.title,
      purchaseType: mock.options.find(o => o.code === 'purchase_type')?.values[0]?.id === 'val_only_ao' ? 'ready' : 'custom',
      material: locale === 'vi' ? 'Lụa Hà Đông cao cấp' : 'Premium Ha Dong Silk',
      sizes: mock.options.find(o => o.code === 'size')?.values.map(v => v.label) || [],
      colors: mock.options.find(o => o.code === 'color')?.values.map(v => ({
        name: v.label,
        hex: v.hex || '#000',
        imageSrc: v.image || '',
      })) || [],
      longDescription: mock.tabs.find(t => t.key === 'details')?.content_html?.replace(/<[^>]*>/g, '') || mock.short_description,
      secondaryDescription: mock.tabs.find(t => t.key === 'care_instructions')?.content_html?.replace(/<[^>]*>/g, '') || '',
      rating: mock.rating.average.toString(),
      reviewCount: locale === 'vi' ? `${mock.rating.total_reviews} đánh giá` : `${mock.rating.total_reviews} Reviews`,
      stock: locale === 'vi' ? 'Còn hàng' : 'In Stock',
      sku: locale === 'vi' ? 'Mã SP' : 'SKU',
      related: locale === 'vi' ? 'Sản phẩm liên quan' : 'Related Products',
    };

    relatedProducts = mock.related_products.map(p => {
      const catalogItem = productCatalog.find(item => item.id === p.slug || item.id === p.id);
      return {
        id: p.id,
        imageSrc: p.thumbnail,
        hoverImageSrc: p.thumbnail,
        imageAlt: p.name,
        name: p.name,
        description: catalogItem?.description[locale] || p.name,
        price: p.price.toLocaleString('vi-VN') + 'đ',
        priceValue: p.price,
        originalPrice: undefined,
        colors: catalogItem?.colors.map(c => ({ name: c.name, hex: c.hex, imageSrc: c.imageSrc })) || [],
        sizes: catalogItem?.sizes || ['S', 'M', 'L'],
        material: catalogItem?.material || 'Lụa',
        purchaseType: catalogItem?.purchaseType || 'ready',
      };
    });

  } else {
    const product = productCatalog.find((item) => item.id === decodeURIComponent(slug));

    if (!product) {
      notFound();
    }

    galleryImages = Array.from(
      new Set([product.imageSrc, product.hoverImageSrc, ...product.colors.map((color) => color.imageSrc).filter(Boolean)])
    ).slice(0, 4) as string[];

    const rawRelated = productCatalog
      .filter((item) => item.id !== product.id)
      .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
      .slice(0, 4);

    relatedProducts = rawRelated.map(p => ({
      id: p.id,
      imageSrc: p.imageSrc,
      hoverImageSrc: p.hoverImageSrc,
      imageAlt: p.imageAlt,
      name: p.name[locale],
      description: p.description[locale],
      price: p.price[locale],
      priceValue: p.numericPrice,
      originalPrice: p.originalPrice?.[locale],
      colors: p.colors.map(c => ({ name: c.name, hex: c.hex, imageSrc: c.imageSrc })),
      sizes: p.sizes,
      material: p.material,
      purchaseType: p.purchaseType,
    }));

    displayProduct = {
      id: product.id,
      slug: product.id,
      name: product.name[locale],
      description: product.description[locale],
      price: product.price[locale],
      priceValue: product.numericPrice,
      originalPrice: product.originalPrice?.[locale],
      originalPriceValue: product.originalPrice ? parseVndString(product.originalPrice.vi) : undefined,
      imageSrc: product.imageSrc,
      hoverImageSrc: product.hoverImageSrc,
      imageAlt: product.imageAlt,
      category: product.category,
      purchaseType: product.purchaseType,
      material: product.material,
      sizes: product.sizes,
      colors: product.colors.map(c => ({ name: c.name, hex: c.hex, imageSrc: c.imageSrc })),
      longDescription: locale === 'vi'
        ? 'Thiết kế được hoàn thiện với phom dáng mềm mại, chất liệu chọn lọc và các chi tiết tinh tế để phù hợp cho những dịp trang trọng. Sản phẩm giữ nét thanh lịch truyền thống nhưng vẫn dễ phối trong nhịp sống hiện đại.'
        : 'This design is finished with a graceful silhouette, selected fabric, and refined details for formal occasions. It keeps the traditional elegance of Ao Dai while remaining easy to wear in a modern wardrobe.',
      secondaryDescription: locale === 'vi'
        ? 'Mỗi mẫu có thể được tư vấn chỉnh size theo số đo thực tế để tạo cảm giác thoải mái khi mặc trong thời gian dài.'
        : 'Each piece can be advised against real body measurements to keep the fit comfortable through long events.',
      rating: '5.0',
      reviewCount: locale === 'vi' ? '121 đánh giá' : '121 Reviews',
      stock: locale === 'vi' ? 'Còn hàng' : 'In Stock',
      sku: locale === 'vi' ? 'Mã SP' : 'SKU',
      related: locale === 'vi' ? 'Sản phẩm liên quan' : 'Related Products',
    };
  }
  return (
    <ProductDetailClient
      product={displayProduct}
      locale={locale}
      galleryImages={galleryImages}
      relatedProducts={relatedProducts}
      customMeasurementFields={customMeasurementFields}
    />
  );
}
