import { type ProductGroup } from "@repo/shared/sizing";

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
  /** Bảng size gắn riêng; null = theo loại sản phẩm */
  sizeChartId: string | null;
  /** Bảng size đang áp dụng (riêng hoặc thừa hưởng từ loại sản phẩm) */
  effectiveSizeChart: { id: string; name: string; inherited: boolean } | null;
  variants: AdminProductVariant[];
}

export interface AdminProductCategory {
  id: string;
  name: string;
  /** "Nhóm gốc › Loại con" để phân biệt các loại trùng tên ở nhóm khác */
  label: string;
  group: ProductGroup;
  /** Bảng size mặc định đã tính thừa hưởng (loại con chưa gắn thì lấy của nhóm gốc) */
  defaultSizeChartId: string | null;
}

export interface AdminProductSizeChart {
  id: string;
  name: string;
  group: ProductGroup;
  isActive: boolean;
  sizeLabels: string[];
}
