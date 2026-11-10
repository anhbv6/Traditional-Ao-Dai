import { type AdminSaleEvent, type SaleCatalogProduct } from "../types/saleEvents.types";
import {
  DAY_MS,
  ENDING_SOON_DAYS,
  QUOTA_LOW_RATIO,
  appliedProducts,
  findConflicts,
  quotaLeft,
  saleState,
} from "./saleRules";

/** Mức độ: `act` = nên làm ngay, `watch` = để ý */
export type SaleInsight =
  | { kind: "PAUSED"; level: "act"; event: AdminSaleEvent }
  | { kind: "ENDING_SOON"; level: "watch"; event: AdminSaleEvent; days: number }
  | { kind: "QUOTA_LOW"; level: "watch"; event: AdminSaleEvent; product: SaleCatalogProduct; left: number }
  | { kind: "CONFLICT"; level: "watch"; event: AdminSaleEvent; other: AdminSaleEvent; count: number }
  | { kind: "OUT_OF_STOCK"; level: "act"; event: AdminSaleEvent; products: SaleCatalogProduct[] }
  | { kind: "MISSING_EN"; level: "watch"; event: AdminSaleEvent }
  | { kind: "NO_PRODUCTS"; level: "act"; event: AdminSaleEvent };

/**
 * Việc cần để ý trên màn danh sách — chỉ xét chương trình đang chạy / sắp chạy / tạm dừng (nháp chỉ khi sắp tới hạn).
 * Sắp xếp: việc cần làm ngay trước, rồi theo thời điểm bắt đầu.
 */
export function collectSaleInsights(events: AdminSaleEvent[], products: SaleCatalogProduct[], now: string): SaleInsight[] {
  const nowMs = Date.parse(now);
  const items: SaleInsight[] = [];
  const seenPairs = new Set<string>();

  for (const event of events) {
    const state = saleState(event, now);
    if (state === "ENDED" || state === "DRAFT") continue;
    const applied = appliedProducts(event, products);

    if (state === "PAUSED") items.push({ kind: "PAUSED", level: "act", event });
    if (applied.length === 0) items.push({ kind: "NO_PRODUCTS", level: "act", event });

    if (state === "RUNNING") {
      const days = Math.ceil((Date.parse(event.endAt) - nowMs) / DAY_MS);
      if (days <= ENDING_SOON_DAYS) items.push({ kind: "ENDING_SOON", level: "watch", event, days: Math.max(days, 0) });
      for (const product of applied) {
        const rule = event.productRules[product.id];
        const left = quotaLeft(rule);
        if (left !== null && rule?.quota && left <= Math.ceil(rule.quota * QUOTA_LOW_RATIO)) {
          items.push({ kind: "QUOTA_LOW", level: "watch", event, product, left });
        }
      }
    }

    // Hàng may sẵn hết tồn mà vẫn nằm trong đợt sale → khách bấm vào chỉ thấy "hết hàng"
    const outOfStock = applied.filter((product) => product.stock === 0);
    if (outOfStock.length > 0) items.push({ kind: "OUT_OF_STOCK", level: "act", event, products: outOfStock });

    if (!event.nameEn || !event.badgeEn) items.push({ kind: "MISSING_EN", level: "watch", event });

    const conflicts = findConflicts(event, events, products, now);
    const byOther = new Map<string, { other: AdminSaleEvent; count: number }>();
    for (const others of conflicts.values()) {
      for (const other of others) byOther.set(other.id, { other, count: (byOther.get(other.id)?.count ?? 0) + 1 });
    }
    for (const { other, count } of byOther.values()) {
      const key = [event.id, other.id].sort().join("|");
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      items.push({ kind: "CONFLICT", level: "watch", event, other, count });
    }
  }

  return items.sort((a, b) => (a.level === b.level ? a.event.startAt.localeCompare(b.event.startAt) : a.level === "act" ? -1 : 1));
}
