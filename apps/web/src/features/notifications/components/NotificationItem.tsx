"use client";

import { Bell, Package, Scissors, ShieldCheck, Tag, type LucideIcon } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { NotificationType, NotificationView } from "../types/notifications.types";

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  order: Package,
  tailoring: Scissors,
  promotion: Tag,
  system: ShieldCheck,
};

interface NotificationItemProps {
  notification: NotificationView;
  /** Gọi khi bấm vào thông báo (đánh dấu đã đọc, đóng bảng nổi…) */
  onSelect?: (id: string) => void;
  /** `compact`: dòng gọn trong bảng nổi ở header. `full`: dòng rộng ở trang Thông báo */
  variant?: "compact" | "full";
}

/**
 * Một dòng thông báo: icon theo nhóm (khung thoi như logo) · tiêu đề · nội dung · thời gian tương đối · chấm chưa đọc.
 * Bấm → đánh dấu đã đọc rồi chuyển tới trang liên quan (`href`).
 */
export function NotificationItem({ notification, onSelect, variant = "compact" }: NotificationItemProps) {
  const t = useTranslations("NotificationsPage");
  const format = useFormatter();
  /* Cập nhật mỗi phút để "5 phút trước" tự nhảy */
  const now = useNow({ updateInterval: 60_000 });
  const Icon = TYPE_ICONS[notification.type] ?? Bell;
  const isFull = variant === "full";

  return (
    <li>
      <Link
        href={notification.href ?? "/notifications"}
        onClick={() => onSelect?.(notification.id)}
        className={cn(
          "group relative flex gap-3.5 outline-none transition-colors hover:bg-[var(--bg-main)] focus-visible:bg-[var(--bg-main)]",
          isFull ? "px-4 py-5 sm:gap-5 sm:px-6" : "px-5 py-3.5",
          !notification.read && "bg-[color-mix(in_oklab,var(--primary-color)_5%,transparent)]",
        )}
      >
        {/* Icon nhóm trong khung thoi */}
        <span
          className={cn(
            "relative grid shrink-0 place-items-center text-[var(--primary-ink)]",
            isFull ? "size-11" : "size-9",
          )}
        >
          <span aria-hidden="true" className="absolute inset-1.5 rotate-45 border border-[var(--primary-color)]/35 transition-colors group-hover:border-[var(--primary-color)]" />
          <Icon size={isFull ? 18 : 15} strokeWidth={1.5} className="relative" aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "text-[var(--text-main)]",
                isFull ? "text-[15px]" : "line-clamp-1 text-[13px]",
                notification.read ? "font-medium" : "font-semibold",
              )}
            >
              {t(`items.${notification.id}.title`)}
            </span>
            {!notification.read ? (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--primary-color)]">
                <span className="sr-only">{t("unread")}</span>
              </span>
            ) : null}
          </span>
          <span
            className={cn(
              "mt-1 block text-[var(--text-light)]",
              isFull ? "text-sm leading-6" : "line-clamp-2 text-[12px] leading-5",
            )}
          >
            {t(`items.${notification.id}.body`)}
          </span>
          <time
            dateTime={notification.createdAt}
            className="mt-1.5 block text-[11px] uppercase tracking-[1px] text-[var(--text-light)]/80"
          >
            {format.relativeTime(new Date(notification.createdAt), now)}
          </time>
        </span>
      </Link>
    </li>
  );
}
