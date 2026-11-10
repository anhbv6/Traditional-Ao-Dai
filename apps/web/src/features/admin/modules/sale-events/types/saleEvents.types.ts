import { type ProductGroup } from "@repo/shared/sizing";

/** Cách giảm: theo %, trừ thẳng số tiền, hoặc đồng giá (mọi món về cùng một giá) */
export type SaleDiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FIXED_PRICE";

/** Phạm vi áp dụng — chọn theo bộ sưu tập / loại sản phẩm thì sản phẩm mới thêm vào cũng tự vào chương trình */
export type SaleScope = "ALL" | "COLLECTIONS" | "CATEGORIES" | "PRODUCTS";

/** Trạng thái lưu: nháp chưa công bố, đã công bố (tự chạy theo giờ), tạm dừng tay */
export type SaleStoredStatus = "DRAFT" | "PUBLISHED" | "PAUSED";

export type SaleProductSaleMode = "SINGLE" | "SET" | "CUSTOM";

/** Sản phẩm trong danh mục — đủ để tính phạm vi và giá sale (tiền là số nguyên VND) */
export interface SaleCatalogProduct {
  id: string;
  code: string;
  name: string;
  group: ProductGroup;
  categoryId: string;
  categoryName: string;
  collectionIds: string[];
  saleMode: SaleProductSaleMode;
  basePrice: number;
  /** Tồn may sẵn (cộng mọi SKU) — may đo thì null */
  stock: number | null;
  isActive: boolean;
}

export interface SaleScopeOption {
  id: string;
  name: string;
  /** Nhóm hàng (chỉ loại sản phẩm) */
  group?: ProductGroup;
}

/** Thiết lập riêng một sản phẩm trong chương trình */
export interface SaleProductRule {
  /** Giá sale đặt tay — null = tính theo mức giảm chung */
  overridePrice: number | null;
  /** Số suất bán giá sale — null = không giới hạn (hết suất thì về giá gốc) */
  quota: number | null;
  /** Đã bán giá sale */
  sold: number;
}

export type SaleActivityKind = "CREATED" | "UPDATED" | "PUBLISHED" | "PAUSED" | "RESUMED" | "ENDED_EARLY" | "PRICE_OVERRIDE";

export interface SaleActivity {
  id: string;
  kind: SaleActivityKind;
  at: string;
  actor: string;
  note: string | null;
}

/** Kết quả bán (chỉ có khi chương trình đã chạy) */
export interface SaleStats {
  orders: number;
  units: number;
  /** Doanh thu theo giá sale */
  revenue: number;
  /** Tổng tiền đã giảm so với giá gốc */
  discountGiven: number;
  /** Doanh thu theo ngày từ lúc chạy — để vẽ dải cột nhỏ */
  dailyRevenue: number[];
  topProducts: { productId: string; units: number; revenue: number }[];
}

export interface AdminSaleEvent {
  id: string;
  name: string;
  nameEn: string | null;
  /** Nhãn gắn trên ảnh sản phẩm ở storefront, VD "Sale Tết" */
  badge: string;
  badgeEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  startAt: string;
  endAt: string;
  status: SaleStoredStatus;
  /** Kết thúc sớm bằng tay — có thì coi như đã kết thúc từ mốc này */
  endedEarlyAt: string | null;
  discountType: SaleDiscountType;
  /** % giảm, số tiền giảm hoặc giá đồng giá */
  value: number;
  scope: SaleScope;
  scopeIds: string[];
  /** Không áp cho áo may đo (giá may đo báo theo cấu hình riêng) */
  excludeCustom: boolean;
  excludedProductIds: string[];
  productRules: Record<string, SaleProductRule>;
  /** Mỗi khách mua tối đa bao nhiêu món giá sale / đơn — null = không giới hạn */
  perCustomerLimit: number | null;
  stackWithCoupon: boolean;
  showCountdown: boolean;
  featuredOnHome: boolean;
  stats: SaleStats | null;
  activity: SaleActivity[];
  createdBy: string;
  updatedAt: string;
}

export interface SaleCatalog {
  products: SaleCatalogProduct[];
  collections: SaleScopeOption[];
  categories: SaleScopeOption[];
}

export interface SaleEventsBoardData extends SaleCatalog {
  events: AdminSaleEvent[];
  now: string;
}

export interface SaleEventEditorData extends SaleCatalog {
  /** null = tạo mới */
  event: AdminSaleEvent | null;
  /** Tạo mới từ bản nhân bản — giá trị khởi đầu của form (đã đổi tên, về nháp, xóa số liệu) */
  template: AdminSaleEvent | null;
  /** Các chương trình khác — để phát hiện sản phẩm trùng thời gian */
  others: AdminSaleEvent[];
  now: string;
}
