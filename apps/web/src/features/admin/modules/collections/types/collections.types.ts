import { type CollectionStatus } from "@repo/db";

export type { CollectionStatus } from "@repo/db";

/** Một dòng ở màn danh sách — ngày giờ trả về dạng ISO để truyền qua Server Action / RSC */
export interface AdminCollectionItem {
  id: string;
  code: string;
  slug: string;
  name: string;
  tagline: string | null;
  season: string | null;
  coverImage: string | null;
  bannerImage: string | null;
  accentColor: string | null;
  status: CollectionStatus;
  launchAt: string | null;
  endAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  showOnHomepage: boolean;
  homepageOrder: number;
  showInLookbook: boolean;
  /** Tổng sản phẩm trong bộ sưu tập */
  productCount: number;
  /** Số sản phẩm đang mở bán (Product.isActive) */
  sellingCount: number;
  updatedAt: string;
}

/** Bộ sưu tập khác mà sản phẩm cũng thuộc về — để thấy ngay case một sản phẩm nằm ở nhiều mùa */
export interface CollectionMembership {
  id: string;
  name: string;
  status: CollectionStatus;
}

export interface AdminCollectionProduct {
  productId: string;
  isHighlighted: boolean;
}

export interface AdminCollectionDetail extends AdminCollectionItem {
  nameEn: string | null;
  taglineEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  story: string | null;
  storyEn: string | null;
  seasonEn: string | null;
  coverImageMobile: string | null;
  bannerImageMobile: string | null;
  gallery: string[];
  autoPushOosToBottom: boolean;
  seoTitle: string | null;
  seoTitleEn: string | null;
  seoDescription: string | null;
  seoDescriptionEn: string | null;
  products: AdminCollectionProduct[];
}

/** Sản phẩm để chọn vào bộ sưu tập (kèm trạng thái bán và các bộ sưu tập đang thuộc) */
export interface CollectionPickerProduct {
  id: string;
  name: string;
  nameEn: string | null;
  image: string | null;
  basePrice: number;
  categoryName: string | null;
  isActive: boolean;
  /** Đủ điều kiện mở bán (ảnh, giá, SKU) — dùng dự báo khi kích hoạt bộ sưu tập */
  isReady: boolean;
  totalStock: number;
  collections: CollectionMembership[];
}

/** Ảnh hưởng tới sản phẩm khi đổi trạng thái — hiện trong hộp xác nhận trước khi thực hiện */
export interface CollectionStatusImpact {
  productCount: number;
  /** Đang ẩn */
  hiddenProducts: number;
  /** Đang ẩn nhưng đủ điều kiện mở bán */
  readyHiddenProducts: number;
  /** Đang bán và không thuộc bộ sưu tập ĐANG MỞ BÁN nào khác */
  exclusiveActiveProducts: number;
  /** Đang bán nhờ một bộ sưu tập khác đang mở bán — không bị ảnh hưởng */
  sharedActiveProducts: number;
}
