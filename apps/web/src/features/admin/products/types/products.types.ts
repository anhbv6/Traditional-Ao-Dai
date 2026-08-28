export interface AdminProductItem {
  id: string;
  name: string;
  slug: string;
  material?: string | null;
  basePrice: string | number;
  images: string[];
  soldCount: number;
  isCustomFit: boolean;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  categoryName?: string;
  variantsCount: number;
  totalStock: number;
  createdAt: Date | string;
}

export interface CategoryOption {
  id: string;
  name: string;
}
