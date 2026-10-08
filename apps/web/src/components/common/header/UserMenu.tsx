'use client';

import { useState } from 'react';
import { LogOut, UserRound } from 'lucide-react';
import { Link} from '@/i18n/routing';
import { useAuthStore, useCustomerLogout } from '@/features/auth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmDialog, Dropdown } from "@/components/shared";
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



  if (!userName) {
    return (
      <Link
        href="/login"
        className="min-w-[130px] ml-5 hidden h-11 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 sm:inline-flex"
      >
        {loginLabel}
      </Link>
    );
  }

  return (
    <>
      <Dropdown
        className="hidden sm:block"
        contentClassName="w-44"
        align="end"
        trigger={({ open, toggle }) => (
          <button
            type="button"
            onClick={toggle}
            className="grid h-11 w-11 place-items-center rounded-full text-primary transition-opacity hover:opacity-75 outline-none cursor-pointer"
            aria-expanded={open}
            aria-label={profileLabel}
          >
            <Avatar size="lg" className="border border-[#E2D9D2] shadow-sm">
              {avatarUrl && (
                <AvatarImage
                  src={avatarUrl}
                  alt={avatarLabel}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-[#FAF7F5] text-xs font-bold uppercase text-[#800020]">
                {avatarFallback || <UserRound size={18} strokeWidth={1.6} aria-hidden="true" />}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      >
        {({ close }) => (
          <>
            <Link
              href="/profile"
              onClick={close}
              className="relative z-10 block rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-[#FAF7F5] hover:text-primary"
            >
              {profileLabel}
            </Link>
            <Link
              href="/profile/orders"
              onClick={close}
              className="relative z-10 block rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-[#FAF7F5] hover:text-primary"
            >
              {ordersLabel}
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/dashboard"
                onClick={close}
                className="relative z-10 block rounded-lg px-3 py-2 text-sm font-semibold text-[#800020] transition-colors hover:bg-[#FAF7F5]"
              >
                Về trang quản trị
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  close();
                  setOpenConfirm(true);
                }}
                className="relative z-10 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60 cursor-pointer"
              >
                <LogOut size={15} strokeWidth={1.6} />
                {logoutLabel}
              </button>
            )}
          </>
        )}
      </Dropdown>
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
