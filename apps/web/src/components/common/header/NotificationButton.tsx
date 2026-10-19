'use client';

import React, { useState } from 'react';
import { ArrowRight, Bell, BellOff, CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth';
import { NotificationItem, useNotifications } from '@/features/notifications';
import { Link, usePathname } from '@/i18n/routing';
import { ActionLink } from '@/components/shared/ActionLink';
import { AppPopover, AppPopoverTitle } from '@/components/shared/AppPopover';
import { CountBadge } from './CountBadge';

type NotificationButtonProps = {
  label?: string;
  /** Bật bảng xem nhanh khi rê chuột (chỉ desktop — thiết bị cảm ứng bấm thẳng vào trang thông báo) */
  preview?: boolean;
};

const OPEN_DELAY = 80;
const CLOSE_DELAY = 180;
/** Số thông báo hiện trong bảng xem nhanh */
const PREVIEW_LIMIT = 5;

/**
 * Chuông thông báo ở header (chỉ hiện khi khách đã đăng nhập) — cùng khuôn với CartButton:
 * bấm luôn sang trang /notifications; desktop rê chuột / focus mở bảng xem nhanh (AppPopover)
 * gồm 5 thông báo mới nhất + "Đánh dấu tất cả đã đọc" + "Xem tất cả". Huy hiệu = số chưa đọc (CountBadge).
 */
export function NotificationButton({ label = 'Notifications', preview = false }: NotificationButtonProps) {
  const t = useTranslations('NotificationsPage');
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) return null;

  const canPreview = preview && pathname !== '/notifications';
  const close = () => setIsOpen(false);
  const handleSelect = (id: string) => {
    markRead(id);
    close();
  };

  return (
    <AppPopover
      disabled={!canPreview}
      open={isOpen}
      onOpenChange={setIsOpen}
      openOnHover
      delay={OPEN_DELAY}
      closeDelay={CLOSE_DELAY}
      width={380}
      showArrow={false}
      trigger={
        <Link
          href="/notifications"
          aria-label={unreadCount > 0 ? `${label} (${unreadCount})` : label}
          onClick={close}
          className="relative grid h-11 w-11 place-items-center text-primary-ink transition-opacity hover:opacity-75"
        >
          <Bell size={22} strokeWidth={1.5} aria-hidden="true" />
          <CountBadge count={unreadCount} />
        </Link>
      }
      header={
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <AppPopoverTitle className="flex items-center gap-2 font-[family-name:var(--font-playfair)] text-[17px] font-semibold text-[var(--primary-ink)]">
            {t('title')}
            {unreadCount > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--primary-color)] px-1.5 font-[family-name:var(--font-lora)] text-[10px] font-bold text-white [font-variant-numeric:lining-nums]">
                {unreadCount}
              </span>
            ) : null}
          </AppPopoverTitle>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)]"
            >
              <CheckCheck size={13} aria-hidden="true" />
              {t('markAllRead')}
            </button>
          ) : null}
        </div>
      }
    >
      {notifications.length === 0 ? (
        /* ---------- Chưa có thông báo ---------- */
        <div className="flex flex-col items-center px-6 pb-7 pt-3 text-center">
          <span className="relative grid size-14 place-items-center text-[var(--primary-ink)]">
            <span aria-hidden="true" className="absolute inset-2 rotate-45 border border-[var(--primary-color)]/30" />
            <BellOff size={20} strokeWidth={1.4} className="relative" />
          </span>
          <p className="mt-3 text-[13px] text-[var(--text-light)]">{t('emptyDescription')}</p>
        </div>
      ) : (
        <>
          {/* ---------- Danh sách: cuộn riêng, không kéo theo trang (data-lenis-prevent) ---------- */}
          <ul
            data-lenis-prevent
            className="scrollbar-brand max-h-[360px] divide-y divide-[var(--border)] overflow-y-auto overscroll-contain border-y border-[var(--border)]"
          >
            {notifications.slice(0, PREVIEW_LIMIT).map((item) => (
              <NotificationItem key={item.id} notification={item} onSelect={handleSelect} />
            ))}
          </ul>

          <div className="px-5 pb-5 pt-4">
            <ActionLink href="/notifications" onClick={close} fullWidth icon={<ArrowRight />} iconPosition="end">
              {t('viewAll')}
            </ActionLink>
          </div>
        </>
      )}
    </AppPopover>
  );
}
