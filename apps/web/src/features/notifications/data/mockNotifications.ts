import type { AppNotification } from "../types/notifications.types";

/** Mốc thời gian tương đối so với lúc nạp module (để dữ liệu mẫu luôn "mới") */
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/**
 * Dữ liệu mẫu — backend chưa có API thông báo.
 * Nội dung hiển thị nằm trong messages/<locale>/notifications.json → `items.<id>`.
 */
export const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: "orderShipped", type: "order", createdAt: minutesAgo(12), href: "/profile/orders" },
  { id: "tailoringReady", type: "tailoring", createdAt: minutesAgo(95), href: "/profile/orders" },
  { id: "flashSale", type: "promotion", createdAt: minutesAgo(60 * 5), href: "/products" },
  { id: "orderConfirmed", type: "order", createdAt: minutesAgo(60 * 26), href: "/profile/orders" },
  { id: "measurementReminder", type: "tailoring", createdAt: minutesAgo(60 * 50), href: "/custom" },
  { id: "newCollection", type: "promotion", createdAt: minutesAgo(60 * 24 * 4), href: "/products" },
  { id: "securityLogin", type: "system", createdAt: minutesAgo(60 * 24 * 6), href: "/profile" },
];

/** Những thông báo mẫu coi như đã đọc từ trước */
export const MOCK_READ_IDS = ["orderConfirmed", "newCollection", "securityLogin"];
