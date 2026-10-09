import { type Locale } from "@repo/shared";

/**
 * Kiểu dữ liệu hiển thị của feature sản phẩm.
 * Dữ liệu mock nằm trong `../data/*` — import trực tiếp từ đó, không re-export qua file type.
 */

export type { MockProduct } from "../data/mockProducts";
export type { Locale };

export interface DisplayColor {
  name: string;
  hex: string;
  imageSrc?: string;
}

/** Giá theo size (số nguyên VND) — size may đo có thể đắt hơn và không áp dụng giảm giá */
export type SizePrices = Record<string, { price: number; originalPrice?: number }>;

export interface DisplayProduct {
  id: string;
  /** Slug trên URL `/products/<slug>` — khóa sản phẩm trong giỏ hàng & yêu thích */
  slug: string;
  name: string;
  description: string;
  price: string;
  /** Giá số nguyên VND (giỏ hàng / yêu thích) */
  priceValue: number;
  originalPrice?: string;
  originalPriceValue?: number;
  /** Giá riêng theo từng size (nếu sản phẩm có biến thể giá) */
  sizePrices?: SizePrices;
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
  /** Giá số nguyên VND (giỏ hàng / yêu thích) */
  priceValue: number;
  originalPrice?: string;
  colors: DisplayColor[];
  sizes: string[];
  material: string;
  purchaseType: string;
}

export type GridSize = 3 | 4 | 5;
export type SortKey = "all" | "newest" | "priceAsc" | "priceDesc" | "bestSeller" | "favorite";
