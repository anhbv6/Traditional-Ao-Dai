export interface AdminInventoryVariant {
  id: string;
  sku: string;
  size: string;
  color?: string | null;
  price?: number | null;
  stock: number;
  productId: string;
  productName: string;
  productImage?: string | null;
  categoryName?: string | null;
  updatedAt: Date | string;
}
