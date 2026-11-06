import { type ProductGroup } from "@repo/shared/sizing";
import { type SaleMode } from "../utils/saleModes";

export interface AdminProductItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  saleMode: SaleMode;
  materialName: string | null;
  basePrice: number;
  images: string[];
  soldCount: number;
  isCustomFit: boolean;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  categoryName: string | null;
  categoryGroup: ProductGroup;
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
  /** Thuộc tính màu đã gắn; null = SKU cũ chỉ có tên màu dạng chữ hoặc không màu */
  colorId: string | null;
  color: string | null;
  /** null = dùng giá bán chung của sản phẩm */
  price: number | null;
  stock: number;
  /** Đã có đơn hàng / giỏ hàng → không xóa được */
  inUse: boolean;
}

export interface ProductSetItem {
  label: string;
  labelEn: string;
  quantity: number;
  /** Chất liệu riêng của món này; null = theo chất liệu chính */
  materialId: string | null;
}

export interface AdminProductDetail {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  categoryId: string;
  saleMode: SaleMode;
  setItems: ProductSetItem[];
  leadTimeDays: number | null;
  materialId: string | null;
  /** Bảng size gắn riêng; null = theo loại sản phẩm */
  sizeChartId: string | null;
  basePrice: number;
  images: string[];
  isActive: boolean;
  isCustomFit: boolean;
  isFeatured: boolean;
  soldCount: number;
  /** id các giá trị đặc tính thiết kế (cổ, tay, họa tiết, tà, dịp) */
  attributeIds: string[];
  variants: AdminProductVariant[];
  updatedAt: string;
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

/** Chất liệu để chọn trong form — kèm thông số kế thừa hiển thị ngay (thanh đo, bảo quản, định mức) */
export interface AdminProductMaterialOption {
  id: string;
  code: string;
  name: string;
  cover: string | null;
  composition: { fiber: string; percent: number }[];
  metrics: Record<"stretch" | "thickness" | "drape" | "sheerness" | "sheen", number | null>;
  careCodes: string[];
  metersPerTop: number | null;
  metersPerPants: number | null;
  isActive: boolean;
}

/** Giá trị thuộc tính dùng trong form sản phẩm (màu, size, đặc tính thiết kế) */
export interface AdminProductAttributeOption {
  id: string;
  /** Mã nhóm thuộc tính: COLOR, SIZE hoặc nhóm đặc tính thiết kế (có sẵn hoặc admin thêm) */
  group: string;
  code: string;
  name: string;
  hex: string | null;
  isActive: boolean;
}

/** Nhóm đặc tính thiết kế (không gồm màu / size) theo thứ tự ở màn Thuộc tính */
export interface AdminProductDesignGroup {
  code: string;
  name: string;
  nameEn: string | null;
}

/** Dữ liệu tham chiếu cho màn chi tiết sản phẩm */
export interface AdminProductEditorOptions {
  categories: AdminProductCategory[];
  sizeCharts: AdminProductSizeChart[];
  materials: AdminProductMaterialOption[];
  attributes: AdminProductAttributeOption[];
  designGroups: AdminProductDesignGroup[];
}
