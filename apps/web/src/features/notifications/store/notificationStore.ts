import { create } from "zustand";
import { MOCK_NOTIFICATIONS, MOCK_READ_IDS } from "../data/mockNotifications";
import type { AppNotification } from "../types/notifications.types";

interface NotificationState {
  items: AppNotification[];
  readIds: string[];
  markRead: (id: string) => void;
  markAllRead: () => void;
}

/**
 * Danh sách thông báo + trạng thái đã đọc (dùng chung cho chuông ở header và trang Thông báo).
 * Chỉ giữ trong bộ nhớ (không localStorage) — khi có API sẽ thay bằng React Query + endpoint đánh dấu đã đọc.
 */
export const useNotificationStore = create<NotificationState>()((set) => ({
  items: MOCK_NOTIFICATIONS,
  readIds: MOCK_READ_IDS,
  markRead: (id) =>
    set((state) => (state.readIds.includes(id) ? state : { readIds: [...state.readIds, id] })),
  markAllRead: () => set((state) => ({ readIds: state.items.map((item) => item.id) })),
}));
