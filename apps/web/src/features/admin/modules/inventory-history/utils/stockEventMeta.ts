import {
  ClipboardCheck,
  Globe,
  PackagePlus,
  Scissors,
  ShoppingBag,
  Trash,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { type StockEventDirection, type StockEventKind } from "../types/inventoryHistory.types";

/** Giờ của tiệm — mọi mốc "ngày" của nhật ký kho tính theo giờ Việt Nam bất kể máy chủ đặt ở đâu */
export const SHOP_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const STOCK_EVENT_DIRECTION: Record<StockEventKind, StockEventDirection> = {
  RECEIVED: "IN",
  RETURNED: "IN",
  RESTOCK: "IN",
  SOLD_IN_STORE: "OUT",
  ONLINE_ORDER: "OUT",
  CUT: "OUT",
  DAMAGED: "LOSS",
  WASTE: "LOSS",
  STOCKTAKE: "COUNT",
  ADJUST: "COUNT",
};

export const STOCK_EVENT_ICONS: Record<StockEventKind, LucideIcon> = {
  RECEIVED: PackagePlus,
  RETURNED: Undo2,
  RESTOCK: PackagePlus,
  SOLD_IN_STORE: ShoppingBag,
  ONLINE_ORDER: Globe,
  CUT: Scissors,
  DAMAGED: Trash,
  WASTE: Trash,
  STOCKTAKE: ClipboardCheck,
  ADJUST: ClipboardCheck,
};

/** Khung thời gian lọc (ngày) — server tải tối đa phần tử cuối */
export const HISTORY_PERIODS = [7, 30, 90, 180] as const;
export type HistoryPeriod = (typeof HISTORY_PERIODS)[number];

/** Ngày YYYY-MM-DD theo giờ tiệm */
export function toShopDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
