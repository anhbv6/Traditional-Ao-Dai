'use client';

import { ActionLink } from '@/components/shared/ActionLink';
import { useState } from 'react';
import { LayoutDashboard, LogOut, Package, UserRound } from 'lucide-react';
import { usePathname } from '@/i18n/routing';
import { useAuthStore, useCustomerLogout } from '@/features/auth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/shared";
import { AppMenu } from "@/components/shared/AppMenu";
import { useTranslations } from 'next-intl';

import { executeAdminLogout, useAdminSession, useAdminSessionCache } from '@/features/admin';

type UserMenuProps = {
  loginLabel?: string;
  profileLabel?: string;
  ordersLabel?: string;
  logoutLabel?: string;
  userName?: string;
};

function getUserInitials(name?: string) {
  if (!name?.trim()) return null;

  const [firstWord, secondWord] = name.trim().split(/\s+/);
  return `${firstWord?.[0] || ""}${secondWord?.[0] || ""}`.toUpperCase();
}

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
  const [openConfirm, setOpenConfirm] = useState(false);
  const { logout: handleLogout, isLoggingOut } = useCustomerLogout(async () => {
    if (isAdmin) {
      await executeAdminLogout();
      adminSessionCache.clear();
    }
  });
  const t = useTranslations("ProfilePage");
  const tCommon = useTranslations("Common");
  const pathname = usePathname();



  if (!userName) {
    return (
      /* Nút chung ActionLink (variant confirm) — đồng bộ hiệu ứng / kích thước với các CTA khác của storefront */
      <ActionLink href="/login" variant="confirm" size="md" className="ml-3 hidden min-w-[130px] sm:inline-flex">
        {loginLabel}
      </ActionLink>
    );
  }

  return (
    <>
      {/* Menu tài khoản: AppMenu chung (Base UI Menu — phím mũi tên, Esc, focus, tự lật khi sát mép) */}
      <AppMenu
        width={248}
        trigger={
          <button
            type="button"
            className="hidden h-11 w-11 cursor-pointer place-items-center rounded-full text-primary-ink outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]/40 sm:grid"
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
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-playfair)] text-[15px] font-semibold text-[var(--primary-ink)]">{userName}</p>
            {user?.email && user.email !== userName ? (
              <p className="mt-0.5 truncate text-[11px] text-[var(--text-light)]">{user.email}</p>
            ) : null}
          </div>
        }
        items={[
          { key: "profile", label: profileLabel, icon: UserRound, href: "/profile", active: pathname === "/profile" },
          { key: "orders", label: ordersLabel, icon: Package, href: "/profile/orders", active: pathname.startsWith("/profile/orders") },
          { type: "separator", key: "separator" },
          isAdmin
            ? { key: "admin", label: tCommon("adminDashboard"), icon: LayoutDashboard, href: "/admin/dashboard" }
            : { key: "logout", label: logoutLabel, icon: LogOut, tone: "danger", onSelect: () => setOpenConfirm(true) },
        ]}
      />
      <ConfirmDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        confirmVariant="destructive"
        title={t("logoutDialog.title")}
        description={t("logoutDialog.message")}
        confirmText={t("logoutDialog.confirmBtn")}
        cancelText={t("logoutDialog.cancelBtn")}
        isLoading={isLoggingOut}
        customTitle={"text-lg sm:text-2xl"}
        onConfirm={handleLogout}
      />
    </>
  );
}
