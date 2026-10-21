'use client';

import { useState } from 'react';
import { Bell, ChevronRight, Heart, LayoutDashboard, LogOut, Package, UserRound, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { LogoutDialog, useAuthStore } from '@/features/auth';
import { executeAdminLogout } from '@/features/admin/core/auth';
import { useAdminSession, useAdminSessionCache } from '@/features/admin/core/session';
import { useNotifications } from '@/features/notifications';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ActionButton } from '@/components/shared/ActionButton';
import { ActionLink } from '@/components/shared/ActionLink';
import { AppPopover, AppPopoverTitle } from '@/components/shared/AppPopover';
import { cn } from '@/lib/utils';

type UserMenuProps = {
  loginLabel?: string;
  profileLabel?: string;
  ordersLabel?: string;
  logoutLabel?: string;
  userName?: string;
};

type MenuLink = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  /** Số hiển thị cuối dòng (VD thông báo chưa đọc) */
  count?: number;
};

function getUserInitials(name?: string) {
  if (!name?.trim()) return null;

  const [firstWord, secondWord] = name.trim().split(/\s+/);
  return `${firstWord?.[0] || ''}${secondWord?.[0] || ''}`.toUpperCase();
}

/**
 * Menu tài khoản ở header — AppPopover chung (cùng khung với giỏ mini), CHỈ mở khi bấm vào avatar.
 * Gồm: thẻ người dùng · lối tắt (Tài khoản / Đơn hàng / Thông báo / Yêu thích) · Đăng xuất (hoặc Về trang quản trị).
 */
export function UserMenu({
  loginLabel = 'Login',
  profileLabel = 'Profile',
  ordersLabel = 'Orders',
  logoutLabel = 'Logout',
  userName: initialUserName,
}: UserMenuProps) {
  const { isAuthenticated, user: customer } = useAuthStore();
  // Storefront hiển thị phiên khách hàng; nếu chỉ có phiên quản trị thì hiển thị tài khoản quản trị
  const { user: adminUser, isAdminOrStaff: isAdmin } = useAdminSession();
  const adminSessionCache = useAdminSessionCache();
  const user = customer ?? adminUser;
  const userName = initialUserName || user?.name || user?.email || (isAuthenticated ? 'Account' : undefined);
  const avatarUrl = user?.avatar || undefined;
  const avatarLabel = userName || profileLabel;
  const avatarFallback = getUserInitials(user?.name || user?.email || userName);
  const [isOpen, setIsOpen] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const logoutAdminToo = async () => {
    if (isAdmin) {
      await executeAdminLogout();
      adminSessionCache.clear();
    }
  };
  const { unreadCount } = useNotifications();
  const tCommon = useTranslations('Common');
  const pathname = usePathname();

  if (!userName) {
    return (
      /* Nút chung ActionLink (variant confirm) — đồng bộ hiệu ứng / kích thước với các CTA khác của storefront */
      <ActionLink href="/login" variant="confirm" size="md" className="ml-3 hidden min-w-[130px] sm:inline-flex">
        {loginLabel}
      </ActionLink>
    );
  }

  const close = () => setIsOpen(false);

  const links: MenuLink[] = [
    { key: 'profile', label: profileLabel, href: '/profile', icon: UserRound, active: pathname === '/profile' },
    { key: 'orders', label: ordersLabel, href: '/profile/orders', icon: Package, active: pathname.startsWith('/profile/orders') },
    // Thông báo chỉ dành cho khách hàng (phiên quản trị không có)
    ...(isAuthenticated
      ? [{ key: 'notifications', label: tCommon('notifications'), href: '/notifications', icon: Bell, active: pathname === '/notifications', count: unreadCount }]
      : []),
    { key: 'wishlist', label: tCommon('wishlist'), href: '/wishlist', icon: Heart, active: pathname === '/wishlist' },
  ];

  return (
    <>
      <AppPopover
        open={isOpen}
        onOpenChange={setIsOpen}
        width={280}
        showArrow={false}
        trigger={
          <button
            type="button"
            className="hidden h-11 w-11 cursor-pointer place-items-center rounded-full text-primary-ink outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]/40 data-[popup-open]:ring-2 data-[popup-open]:ring-[var(--primary-color)]/40 sm:grid"
            aria-label={profileLabel}
          >
            <Avatar size="lg" className="border border-[var(--border)] shadow-sm">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={avatarLabel} className="object-cover" />}
              <AvatarFallback className="bg-[var(--bg-main)] text-xs font-bold uppercase text-[var(--primary-ink)]">
                {avatarFallback || <UserRound size={18} strokeWidth={1.6} aria-hidden="true" />}
              </AvatarFallback>
            </Avatar>
          </button>
        }
        header={
          /* ---------- Thẻ người dùng ---------- */
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 pb-4 pt-5">
            <Avatar size="lg" className="shrink-0 border border-[var(--border)]">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={avatarLabel} className="object-cover" />}
              <AvatarFallback className="bg-[var(--bg-main)] text-xs font-bold uppercase text-[var(--primary-ink)]">
                {avatarFallback || <UserRound size={18} strokeWidth={1.6} aria-hidden="true" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <AppPopoverTitle className="truncate font-[family-name:var(--font-playfair)] text-[16px] font-semibold text-[var(--primary-ink)]">
                {userName}
              </AppPopoverTitle>
              {user?.email && user.email !== userName ? (
                <p className="mt-0.5 truncate text-[11px] text-[var(--text-light)]">{user.email}</p>
              ) : null}
            </div>
          </div>
        }
      >
        {/* ---------- Lối tắt ---------- */}
        <nav aria-label={profileLabel} className="py-2">
          <ul>
            {links.map(({ key, label, href, icon: Icon, active, count }) => (
              <li key={key}>
                <Link
                  href={href}
                  onClick={close}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex items-center gap-3 px-5 py-2.5 text-[13px] outline-none transition-colors hover:bg-[var(--bg-main)] focus-visible:bg-[var(--bg-main)]',
                    active ? 'font-semibold text-[var(--primary-ink)]' : 'text-[var(--text-main)]',
                  )}
                >
                  <Icon size={16} strokeWidth={1.6} aria-hidden="true" className="text-[var(--primary-ink)]" />
                  <span className="flex-1">{label}</span>
                  {count ? (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--primary-color)] px-1.5 text-[10px] font-bold text-white [font-variant-numeric:lining-nums]">
                      {count > 99 ? '99+' : count}
                    </span>
                  ) : (
                    <ChevronRight
                      size={14}
                      aria-hidden="true"
                      className="text-[var(--text-light)] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ---------- Đăng xuất / Về trang quản trị ---------- */}
        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
          {isAdmin ? (
            <ActionLink href="/admin/dashboard" onClick={close} variant="dialog" size="sm" fullWidth icon={<LayoutDashboard />}>
              {tCommon('adminDashboard')}
            </ActionLink>
          ) : (
            <ActionButton
              variant="cancel"
              size="sm"
              fullWidth
              icon={<LogOut />}
              onClick={() => {
                close();
                setOpenConfirm(true);
              }}
            >
              {logoutLabel}
            </ActionButton>
          )}
        </div>
      </AppPopover>

      <LogoutDialog open={openConfirm} onOpenChange={setOpenConfirm} beforeRedirect={logoutAdminToo} />
    </>
  );
}
