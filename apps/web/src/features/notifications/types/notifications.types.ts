/** Nhóm thông báo — quyết định icon và nhãn lọc */
export type NotificationType = "order" | "tailoring" | "promotion" | "system";

/**
 * Một thông báo của khách hàng.
 * Tiêu đề / nội dung lấy từ messages theo `id` (namespace NotificationsPage.items.<id>) để hiển thị đủ 2 ngôn ngữ;
 * khi có API thật sẽ nhận thẳng `title` / `body` đã dịch từ backend.
 */
export interface AppNotification {
  id: string;
  type: NotificationType;
  /** Thời điểm tạo (ISO 8601) */
  createdAt: string;
  /** Trang mở khi bấm vào thông báo */
  href?: string;
}

/** Thông báo kèm trạng thái đã đọc (đã gộp với store) */
export interface NotificationView extends AppNotification {
  read: boolean;
}
