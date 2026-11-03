import { type CollectionStatus } from "../types/collections.types";

export const COLLECTION_STATUSES = [
  "DRAFT",
  "COMING_SOON",
  "ACTIVE",
  "ARCHIVED",
] as const satisfies readonly CollectionStatus[];

/**
 * Bước chuyển hợp lệ của vòng đời:
 * - Nháp → Sắp ra mắt (công bố trước để chạy quảng cáo) hoặc mở bán thẳng
 * - Sắp ra mắt → về Nháp (rút lại) hoặc Mở bán
 * - Mở bán → Lưu trữ (hết mùa)
 * - Lưu trữ → Mở bán lại (bán lại mùa cũ); không quay về Nháp vì đã có link công khai, quảng cáo, SEO
 */
export const COLLECTION_TRANSITIONS: Record<CollectionStatus, readonly CollectionStatus[]> = {
  DRAFT: ["COMING_SOON", "ACTIVE"],
  COMING_SOON: ["DRAFT", "ACTIVE"],
  ACTIVE: ["ARCHIVED"],
  ARCHIVED: ["ACTIVE"],
};

/** Trang chủ hiện tối đa ngần này bộ sưu tập chưa lưu trữ để banner không bị loãng */
export const HOMEPAGE_COLLECTION_LIMIT = 4;
/** Sản phẩm nổi bật của một mùa (hiện to ở đầu trang bộ sưu tập) */
export const MAX_HIGHLIGHTED_PRODUCTS = 3;
export const MAX_COLLECTION_PRODUCTS = 200;
export const MAX_GALLERY_IMAGES = 20;

/** Mã bộ sưu tập: 2–12 chữ in hoa không dấu hoặc số, VD TET26 */
export const COLLECTION_CODE_PATTERN = /^[A-Z0-9]{2,12}$/;

/** Bộ sưu tập khách nhìn thấy được trên website (lưu trữ chỉ còn ở thư viện lookbook) */
export function isPublicStatus(status: CollectionStatus): boolean {
  return status === "COMING_SOON" || status === "ACTIVE";
}

/** Đã từng công bố thì khóa mã và slug — mã đã nằm trong SKU, slug đã được quảng cáo / index */
export function isIdentityLocked(collection: { publishedAt: string | Date | null }): boolean {
  return collection.publishedAt !== null;
}

/**
 * Lý do chưa thể chuyển sang `target` (mã KEY). Dùng ở cả client (hiện danh sách cần bổ sung) lẫn server (chặn thật).
 */
export function getTransitionBlockers(
  collection: {
    status: CollectionStatus;
    coverImage: string | null;
    launchAt: string | Date | null;
    productCount: number;
  },
  target: CollectionStatus
): string[] {
  if (!COLLECTION_TRANSITIONS[collection.status].includes(target)) return ["COLLECTION_TRANSITION_INVALID"];

  const blockers: string[] = [];
  if (target === "COMING_SOON" || target === "ACTIVE") {
    if (!collection.coverImage) blockers.push("COLLECTION_COVER_REQUIRED");
  }
  // Sắp ra mắt phải có ngày mở bán để hiện đếm ngược trên banner / quảng cáo
  if (target === "COMING_SOON" && !collection.launchAt) blockers.push("COLLECTION_LAUNCH_DATE_REQUIRED");
  if (target === "ACTIVE" && collection.productCount === 0) blockers.push("COLLECTION_PRODUCTS_REQUIRED");

  return blockers;
}

/** Tùy chọn kèm theo khi chuyển trạng thái, mặc định bật theo nghiệp vụ */
export function getTransitionOptions(target: CollectionStatus) {
  return {
    // Mở bán: bật bán luôn các sản phẩm đang ẩn nhưng đã đủ điều kiện
    activateReadyProducts: target === "ACTIVE",
    // Sắp ra mắt / lưu trữ: ẩn sản phẩm không còn bán qua bộ sưu tập ĐANG MỞ BÁN nào khác
    hideExclusiveProducts: target === "COMING_SOON" || target === "ARCHIVED",
  };
}

/**
 * Thứ tự hiển thị sản phẩm trong bộ sưu tập. Bật `autoPushOosToBottom` thì sản phẩm hết hàng xuống cuối
 * (giữ nguyên thứ tự tương đối) và không chiếm suất nổi bật — tránh mở trang thấy ngay món không mua được.
 */
export function orderCollectionProducts<T extends { isHighlighted: boolean; totalStock: number }>(
  products: T[],
  autoPushOosToBottom: boolean
): T[] {
  if (!autoPushOosToBottom) return products;
  return [...products.filter((p) => p.totalStock > 0), ...products.filter((p) => p.totalStock <= 0)];
}

const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** "YYYY-MM-DD" (giờ Việt Nam) cho ô chọn ngày */
export function toDateInputValue(value: string | Date | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("sv-SE", { timeZone: VN_TIME_ZONE });
}

/** Ngày chọn ở form → đầu ngày theo giờ Việt Nam */
export function fromDateInputValue(value: string): Date | null {
  return value ? new Date(`${value}T00:00:00+07:00`) : null;
}

/** Số ngày còn lại tới `value` (âm = đã qua) theo lịch Việt Nam */
export function daysUntil(value: string | Date, now: Date = new Date()): number {
  const target = fromDateInputValue(toDateInputValue(value));
  const today = fromDateInputValue(toDateInputValue(now));
  if (!target || !today) return 0;
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
