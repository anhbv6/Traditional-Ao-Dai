import {
  type AdminSaleEvent,
  type SaleCatalogProduct,
  type SaleDiscountType,
  type SaleProductRule,
} from "../types/saleEvents.types";

/*
 * Luật chương trình sale dùng chung cho danh sách, màn soạn (xem trước / kiểm tra) và — khi nối DB — Server Action
 * cùng phần tính giá ở storefront. Giá sale cuối cùng luôn do server tính lại theo đúng các hàm này.
 */

export const SHOP_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;

/** Giảm sâu hơn mức này thì nhắc kiểm tra (dễ gõ nhầm, bán dưới giá vốn vải + công may) */
export const DEEP_DISCOUNT_PERCENT = 50;
/** Còn bấy nhiêu ngày thì coi là "sắp kết thúc" */
export const ENDING_SOON_DAYS = 3;
/** Còn ≤ bấy nhiêu % suất thì coi là "sắp hết suất" */
export const QUOTA_LOW_RATIO = 0.2;
/** Tối đa chương trình được ghim trang chủ cùng lúc (một dải banner) */
export const MAX_HOME_FEATURED = 1;

export const SALE_STATES = ["RUNNING", "SCHEDULED", "DRAFT", "PAUSED", "ENDED"] as const;
export type SaleState = (typeof SALE_STATES)[number];

/** Trạng thái tự suy từ trạng thái lưu + thời gian */
export function saleState(event: Pick<AdminSaleEvent, "status" | "startAt" | "endAt" | "endedEarlyAt">, now: string): SaleState {
  if (event.status === "DRAFT") return "DRAFT";
  if (event.endedEarlyAt || event.endAt <= now) return "ENDED";
  if (event.status === "PAUSED") return "PAUSED";
  if (event.startAt > now) return "SCHEDULED";
  return "RUNNING";
}

/** Mốc kết thúc thật (kết thúc sớm thì lấy mốc đó) */
export const effectiveEnd = (event: Pick<AdminSaleEvent, "endAt" | "endedEarlyAt">) => event.endedEarlyAt ?? event.endAt;

/**
 * Giá sale của một món. % → làm tròn LÊN tới nghìn đồng (khách thấy giá chẵn, tiệm không lỗ phần lẻ);
 * trừ tiền → không âm; đồng giá → chỉ áp khi rẻ hơn giá gốc. Giá đặt tay luôn thắng.
 */
export function computeSalePrice(
  basePrice: number,
  rule: { discountType: SaleDiscountType; value: number },
  overridePrice: number | null = null
): number {
  if (overridePrice !== null) return Math.max(0, Math.min(overridePrice, basePrice));
  if (rule.value <= 0) return basePrice;
  switch (rule.discountType) {
    case "PERCENTAGE":
      return Math.min(basePrice, Math.ceil((basePrice * (100 - Math.min(rule.value, 100))) / 100 / 1000) * 1000);
    case "FIXED_AMOUNT":
      return Math.max(0, basePrice - rule.value);
    case "FIXED_PRICE":
      return Math.min(basePrice, rule.value);
  }
}

export const discountPercent = (basePrice: number, salePrice: number) =>
  basePrice > 0 ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0;

type ScopeInput = Pick<AdminSaleEvent, "scope" | "scopeIds" | "excludeCustom" | "excludedProductIds">;

/** Sản phẩm thuộc phạm vi (chưa trừ danh sách loại) — chỉ sản phẩm đang bán */
export function productsInScope(event: Pick<ScopeInput, "scope" | "scopeIds">, products: SaleCatalogProduct[]): SaleCatalogProduct[] {
  const ids = new Set(event.scopeIds);
  return products.filter((product) => {
    if (!product.isActive) return false;
    switch (event.scope) {
      case "ALL":
        return true;
      case "COLLECTIONS":
        return product.collectionIds.some((id) => ids.has(id));
      case "CATEGORIES":
        return ids.has(product.categoryId);
      case "PRODUCTS":
        return ids.has(product.id);
    }
  });
}

/** Lý do một sản phẩm trong phạm vi không được giảm */
export type ExclusionReason = "CUSTOM" | "MANUAL" | null;

export function exclusionReason(product: SaleCatalogProduct, event: Pick<ScopeInput, "excludeCustom" | "excludedProductIds">): ExclusionReason {
  if (event.excludedProductIds.includes(product.id)) return "MANUAL";
  if (event.excludeCustom && product.saleMode === "CUSTOM") return "CUSTOM";
  return null;
}

/** Sản phẩm thực sự được giảm giá */
export function appliedProducts(event: ScopeInput, products: SaleCatalogProduct[]): SaleCatalogProduct[] {
  return productsInScope(event, products).filter((product) => exclusionReason(product, event) === null);
}

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd;

/**
 * Sản phẩm trùng với chương trình khác trong cùng khoảng thời gian (bỏ nháp / đã kết thúc).
 * Storefront chỉ áp MỘT giá sale — giá thấp nhất cho khách — nên trùng lặp là điều cần biết, không phải lỗi chặn.
 */
export function findConflicts(
  event: ScopeInput & Pick<AdminSaleEvent, "id" | "startAt" | "endAt">,
  others: AdminSaleEvent[],
  products: SaleCatalogProduct[],
  now: string
): Map<string, AdminSaleEvent[]> {
  const mine = new Set(appliedProducts(event, products).map((product) => product.id));
  const result = new Map<string, AdminSaleEvent[]>();
  for (const other of others) {
    if (other.id === event.id) continue;
    const state = saleState(other, now);
    if (state === "DRAFT" || state === "ENDED") continue;
    if (!overlaps(event.startAt, event.endAt, other.startAt, effectiveEnd(other))) continue;
    for (const product of appliedProducts(other, products)) {
      if (!mine.has(product.id)) continue;
      result.set(product.id, [...(result.get(product.id) ?? []), other]);
    }
  }
  return result;
}

/** Suất còn lại của một sản phẩm (null = không giới hạn) */
export const quotaLeft = (rule: SaleProductRule | undefined) =>
  rule?.quota == null ? null : Math.max(0, rule.quota - rule.sold);

/** YYYY-MM-DD và HH:mm theo giờ tiệm */
export function toShopParts(iso: string): { day: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  return { day: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** Ghép ngày + giờ theo giờ tiệm (+07:00) thành ISO */
export function shopPartsToIso(day: string, time: string): string {
  return new Date(`${day}T${time || "00:00"}:00+07:00`).toISOString();
}

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Gợi ý ID tạm cho bản mock */
export const mockId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
