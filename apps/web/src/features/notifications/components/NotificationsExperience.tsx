"use client";

import { useState } from "react";
import { BellOff, CheckCheck, Inbox, Mail, Package, Scissors, ShieldCheck, Tag, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/shared/ActionButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { BackButton } from "@/components/shared/BackButton";
import { cn } from "@/lib/utils";
import { useNotifications } from "../hooks/useNotifications";
import type { NotificationType } from "../types/notifications.types";
import { NotificationItem } from "./NotificationItem";

type Filter = "all" | "unread" | NotificationType;

const FILTERS: Filter[] = ["all", "unread", "order", "tailoring", "promotion", "system"];

const FILTER_ICONS: Record<Filter, LucideIcon> = {
  all: Inbox,
  unread: Mail,
  order: Package,
  tailoring: Scissors,
  promotion: Tag,
  system: ShieldCheck,
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Trang Thông báo:
 * - Tiêu đề cùng khuôn với Yêu thích / Giỏ hàng: mũi tên quay lại + eyebrow → tiêu đề + mô tả.
 * - Nội dung: desktop chia 2 cột — trái là menu lọc theo nhóm (kèm số lượng) + "đánh dấu tất cả đã đọc", phải là danh sách.
 *   Mobile: menu thành hàng chip cuộn ngang phía trên danh sách.
 */
export function NotificationsExperience() {
  const t = useTranslations("NotificationsPage");
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  /* Số thông báo theo từng mục lọc (hiện cạnh tên mục) */
  const counts = FILTERS.reduce(
    (acc, key) => {
      acc[key] = notifications.filter((item) =>
        key === "all" ? true : key === "unread" ? !item.read : item.type === key,
      ).length;
      return acc;
    },
    {} as Record<Filter, number>,
  );

  const visible = notifications.filter((item) =>
    filter === "all" ? true : filter === "unread" ? !item.read : item.type === filter,
  );

  return (
    <div className="font-[family-name:var(--font-lora)] text-[var(--text-main)]">
      {/* Tiêu đề: mũi tên quay lại + eyebrow → tiêu đề + mô tả (giống Yêu thích / Giỏ hàng) */}
      <header className="mb-8 sm:mb-10">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex items-center gap-2"
        >
          <BackButton variant="inline" />
          <p className="text-[10px] uppercase tracking-[3px] text-[var(--text-light)] sm:text-[11px]">{t("eyebrow")}</p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl"
        >
          {t("title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="mt-1.5 max-w-xl text-[13px] leading-6 text-[var(--text-light)]"
        >
          {t("subtitle")}
        </motion.p>
      </header>

      {/* Desktop: menu lọc bên trái (bám khi cuộn) · danh sách bên phải. Mobile: chip cuộn ngang phía trên */}
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-14">
        <aside className="mb-6 lg:mb-0">
          <div className="lg:sticky lg:top-28">
            <p className="mb-3 hidden text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-light)] lg:block">
              {t("label")}
            </p>
            <div
              role="tablist"
              aria-label={t("label")}
              aria-orientation="vertical"
              className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-l lg:border-[var(--border)] lg:px-0 [&::-webkit-scrollbar]:hidden"
            >
              {FILTERS.map((key) => {
                const active = filter === key;
                const Icon = FILTER_ICONS[key];
                const count = counts[key];
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(key)}
                    className={cn(
                      "flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap border text-[11px] font-semibold uppercase tracking-[1.5px] transition-colors",
                      /* Mobile: chip */
                      "px-3 py-1.5",
                      active
                        ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                        : "border-transparent text-[var(--text-light)] hover:border-[var(--border)] hover:text-[var(--primary-ink)]",
                      /* Desktop: dòng menu dọc, vạch đỏ đô bên trái cho mục đang chọn */
                      "lg:-ml-px lg:w-full lg:border-0 lg:border-l-2 lg:bg-transparent lg:px-4 lg:py-3 lg:text-[12px] lg:normal-case lg:tracking-normal",
                      active
                        ? "lg:border-[var(--primary-color)] lg:bg-[color-mix(in_oklab,var(--primary-color)_6%,transparent)] lg:text-[var(--primary-ink)]"
                        : "lg:border-transparent lg:hover:bg-[var(--bg-card)]",
                    )}
                  >
                    <Icon aria-hidden="true" className="hidden size-4 shrink-0 lg:block" strokeWidth={1.6} />
                    <span className="lg:flex-1 lg:text-left">{t(`filters.${key}`)}</span>
                    {count > 0 ? (
                      <span
                        className={cn(
                          "tabular-nums",
                          key === "unread"
                            ? "lg:grid lg:h-5 lg:min-w-5 lg:place-items-center lg:rounded-full lg:bg-[var(--primary-color)] lg:px-1.5 lg:text-[10px] lg:text-white"
                            : "lg:text-[var(--text-light)]",
                        )}
                      >
                        <span className="lg:hidden">({count})</span>
                        <span className="hidden lg:inline">{count}</span>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <ActionButton
              variant={unreadCount > 0 ? "dialog" : "disabled"}
              size="sm"
              fullWidth
              icon={<CheckCheck />}
              onClick={markAllRead}
              className="mt-4 hidden lg:inline-flex"
            >
              {t("markAllRead")}
            </ActionButton>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Thanh trên danh sách: nhóm đang xem + số lượng (mobile kèm nút đánh dấu đã đọc) */}
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
            <p className="whitespace-nowrap text-[13px] text-[var(--text-light)]">
              <span className="font-semibold text-[var(--text-main)]">{t(`filters.${filter}`)}</span>
              {" · "}
              {t("resultCount", { count: visible.length })}
            </p>
            <ActionButton
              variant={unreadCount > 0 ? "dialog" : "disabled"}
              size="sm"
              icon={<CheckCheck />}
              onClick={markAllRead}
              className="shrink-0 lg:hidden"
            >
              {t("markAllRead")}
            </ActionButton>
          </div>

          {visible.length > 0 ? (
            <ul className="divide-y divide-[var(--border)] border-b border-[var(--border)]">
              {visible.map((item) => (
                <NotificationItem key={item.id} notification={item} onSelect={markRead} variant="full" />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={BellOff}
              title={notifications.length ? t("emptyFilteredTitle") : t("emptyTitle")}
              description={notifications.length ? t("emptyFilteredDescription") : t("emptyDescription")}
              action={notifications.length ? t("showAll") : t("emptyAction")}
              {...(notifications.length ? { onAction: () => setFilter("all") } : { href: "/products" })}
              className="py-14"
            />
          )}
        </div>
      </div>
    </div>
  );
}
