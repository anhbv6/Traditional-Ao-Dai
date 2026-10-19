import { useMemo } from "react";
import { useNotificationStore } from "../store/notificationStore";
import type { NotificationView } from "../types/notifications.types";

/** Thông báo (mới nhất trước) kèm cờ đã đọc + số chưa đọc + hành động đánh dấu */
export function useNotifications() {
  const items = useNotificationStore((state) => state.items);
  const readIds = useNotificationStore((state) => state.readIds);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  const notifications = useMemo<NotificationView[]>(
    () =>
      [...items]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((item) => ({ ...item, read: readIds.includes(item.id) })),
    [items, readIds],
  );

  const unreadCount = notifications.filter((item) => !item.read).length;

  return { notifications, unreadCount, markRead, markAllRead };
}
