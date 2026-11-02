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
  categoryName?: string | null;
  variantsCount: number;
  totalStock: number;
  /** Số SKU đang ở mức sắp hết (LOW_STOCK_THRESHOLD) */
  lowStockVariants: number;
  createdAt: Date | string;
}

export interface AdminProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string | null;
  /** null = dùng giá bán chung của sản phẩm */
  price: number | null;
  stock: number;
}

export interface AdminProductDetail extends AdminProductItem {
  nameEn: string | null;
  materialEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  variants: AdminProductVariant[];
}

export interface AdminProductCategory {
  id: string;
  name: string;
}
