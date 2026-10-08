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

export type GridSize = 3 | 4 | 5;
export type SortKey = "all" | "newest" | "priceAsc" | "priceDesc" | "bestSeller" | "favorite";
