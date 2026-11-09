'use client';

import { ChevronRight, ClipboardList, Package, Scissors, Shirt, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ADMIN_MODULE_ACCESS, canAccess, useAdminSession, type AdminModule } from '@/features/admin/core/session';

type Shortcut = { key: 'orders' | 'tailoring' | 'products' | 'inventory'; module: AdminModule; href: string; icon: LucideIcon };

/** Lối tắt hay dùng nhất khi đang xem cửa hàng — lọc theo quyền như menu admin */
const SHORTCUTS: readonly Shortcut[] = [
  { key: 'orders', module: 'orders', href: '/admin/orders', icon: ClipboardList },
  { key: 'tailoring', module: 'tailoring', href: '/admin/tailoring', icon: Scissors },
  { key: 'products', module: 'products', href: '/admin/products', icon: Shirt },
  { key: 'inventory', module: 'inventory', href: '/admin/inventory/skus', icon: Package },
];

/**
 * Thanh mỏng trên đầu storefront cho STAFF / ADMIN đang có phiên quản trị.
 * Tông đơn sắc + font Inter của khu admin để tách khỏi giao diện cửa hàng.
 * Chỉ là lối tắt hiển thị — quyền thật vẫn kiểm tra ở page / Server Action admin.
 */
export function AdminQuickBar() {
  // Phiên quản trị lấy từ server, chỉ hỏi khi trình duyệt có cờ `admin_session`
  const { user, isAdmin } = useAdminSession();
  const t = useTranslations('Common.adminBar');

  if (!user) {
    return null;
  }

  const displayName = user.name || user.email || '';
  const initial = displayName.trim().charAt(0).toUpperCase() || '·';
  const shortcuts = SHORTCUTS.filter((item) => canAccess(user, ADMIN_MODULE_ACCESS[item.module]));

  return (
    <div
      role="region"
      aria-label={t('label')}
      className="admin-shell relative z-50 w-full select-none border-b border-white/[0.06] bg-(--admin-ink) text-zinc-400"
    >
      <div className="flex h-10 items-center gap-4 px-4 text-xs sm:px-8">
        {/* Người đang duyệt */}
        <div className="flex min-w-0 items-center gap-2.5">
          {user.avatarUrl ? (
            // Avatar là URL tùy ý do người dùng tải lên — không qua next/image remotePatterns
            // eslint-disable-next-line @next/next/no-img-element -- URL avatar tùy ý
            <img src={user.avatarUrl} alt="" className="size-6 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-700 text-2xs font-semibold text-zinc-100"
            >
              {initial}
            </span>
          )}
          <p className="flex min-w-0 items-baseline gap-2 leading-none">
            <span className="truncate font-medium text-zinc-100">{displayName}</span>
            <span className="shrink-0 text-zinc-500">{t(`roles.${isAdmin ? 'ADMIN' : 'STAFF'}`)}</span>
          </p>
          <span aria-hidden="true" className="hidden h-3.5 w-px shrink-0 bg-white/10 lg:block" />
          <span className="hidden shrink-0 items-center gap-1.5 lg:inline-flex">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" />
            {t('previewing')}
          </span>
        </div>

        {/* Lối tắt + vào trang quản trị */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {shortcuts.length > 0 ? (
            <nav aria-label={t('shortcutsLabel')} className="hidden items-center gap-0.5 md:flex">
              {shortcuts.map(({ key, href, icon: Icon }) => (
                <Link
                  key={key}
                  href={href}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 focus-visible:outline-1 focus-visible:outline-white/40"
                >
                  <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
                  {t(`shortcuts.${key}`)}
                </Link>
              ))}
              <span aria-hidden="true" className="mx-2 h-3.5 w-px bg-white/10" />
            </nav>
          ) : null}

          <Link
            href="/admin/dashboard"
            className="group inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 font-medium text-zinc-100 transition-colors hover:bg-white/[0.06] focus-visible:outline-1 focus-visible:outline-white/40"
          >
            <span className="sm:hidden">{t('openDashboardShort')}</span>
            <span className="hidden sm:inline">{t('openDashboard')}</span>
            <ChevronRight
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className="text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-100"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
