import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { showToast } from "@/components/ui/toast";
import { useNotificationStore } from "../store/notificationStore";
import type { NotificationView } from "../types/notifications.types";

/**
 * Thông báo (mới nhất trước) kèm cờ đã đọc + số chưa đọc + hành động đánh dấu.
 * "Đánh dấu tất cả đã đọc" hiện thông báo có "Hoàn tác" (trả lại đúng các mục chưa đọc trước đó).
 */
export function useNotifications() {
  const t = useTranslations("NotificationsPage");
  const items = useNotificationStore((state) => state.items);
  const readIds = useNotificationStore((state) => state.readIds);
  const markRead = useNotificationStore((state) => state.markRead);

  const notifications = useMemo<NotificationView[]>(
    () =>
      [...items]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((item) => ({ ...item, read: readIds.includes(item.id) })),
    [items, readIds],
  );

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAllRead = () => {
    if (unreadCount === 0) return;
    const { readIds: previous, markAllRead: markAll, restoreReadIds } = useNotificationStore.getState();
    markAll();
    showToast.undo({
      title: t("undo.markedAllRead", { count: unreadCount }),
      actionLabel: t("undo.action"),
      onUndo: () => restoreReadIds(previous),
    });
  };

  return { notifications, unreadCount, markRead, markAllRead };
}
