'use client';

import { LogOut, Menu, UserRound } from 'lucide-react';
import { Link, usePathname, useRouter, routing } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerClose,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Logo } from './Logo';
import type { NavItem } from './types';
import { LogoutDialog, useAuthStore } from '@/features/auth';
import { ActionButton } from '@/components/shared/ActionButton';
import { ActionLink } from '@/components/shared/ActionLink';
import { executeAdminLogout } from '@/features/admin/core/auth';
import { useAdminSession, useAdminSessionCache } from '@/features/admin/core/session';

type MobileMenuProps = {
  items: NavItem[];
  loginLabel?: string;
  profileLabel?: string;
  logoutLabel?: string;
  languageLabel?: string;
  taglineDrawer?: string;
};

export function MobileMenu({
  items,
  loginLabel = 'Login',
  profileLabel = 'Profile',
  logoutLabel = 'Logout',
  languageLabel = 'Ngôn ngữ',
  taglineDrawer,
}: MobileMenuProps) {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const tCommon = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuLabel = tCommon('mobileMenu.open');
  const navLabel = tCommon('mobileMenu.nav');
  const adminLabel = tCommon('mobileMenu.admin');
  const { isAuthenticated, user: customer } = useAuthStore();
  const { user: adminUser, isAdminOrStaff: isAdmin } = useAdminSession();
  const adminSessionCache = useAdminSessionCache();
  const user = customer ?? adminUser;
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const logoutAdminToo = async () => {
    if (isAdmin) {
      await executeAdminLogout();
      adminSessionCache.clear();
    }
  };
  const userName = user?.name || user?.email || (isAuthenticated ? 'Account' : undefined);

  const handleSelectLanguage = (newLocale: string) => {
    if (newLocale === currentLocale || isPending) return;
    setIsDrawerOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  const locales = routing.locales;

  /** Đóng menu rồi mở hộp thoại xác nhận đăng xuất chung (đặt ngoài Drawer nên không bị đóng theo) */
  const handleLogout = () => {
    setIsDrawerOpen(false);
    setIsLogoutOpen(true);
  };

  return (
    <div className="lg:hidden">
      <Drawer direction="right" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          {/* Không đổi nền khi rê / chạm: trên điện thoại trạng thái hover bị "kẹt" sau khi đóng drawer */}
          <button
            type="button"
            className="-mr-2 grid size-10 cursor-pointer place-items-center text-primary-ink transition-opacity hover:opacity-75 sm:size-11"
            aria-label={menuLabel}
          >
            <Menu strokeWidth={1.5} aria-hidden="true" className="size-5 sm:size-6" />
          </button>
        </DrawerTrigger>
        <DrawerContent>
          {/* Đầu drawer: logo + tên (cỡ nhỏ) và slogan bên dưới, nút đóng thẳng hàng với logo */}
          <DrawerHeader className="items-center border-[var(--border)] px-5 pb-4 pt-5">
            <div className="min-w-0">
              <DrawerTitle className="text-base font-normal normal-case tracking-normal">
                <DrawerClose asChild>
                  <Logo textLogo size="sm" />
                </DrawerClose>
              </DrawerTitle>
              <DrawerDescription className="mt-2 font-[family-name:var(--font-dancing)] text-[15px] leading-snug text-primary-ink">
                {taglineDrawer}
              </DrawerDescription>
            </div>
            <DrawerCloseButton className="-mr-2 self-start rounded-none hover:bg-transparent" />
          </DrawerHeader>

          <nav data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2" aria-label={navLabel}>
            {items.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <DrawerClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex min-h-12 items-center justify-between border-b border-[var(--border)] font-[family-name:var(--font-lora)] text-[13px] uppercase tracking-[1.5px] transition-colors',
                      isActive ? 'font-semibold text-primary-ink' : 'text-[var(--text-main)] hover:text-primary-ink',
                    )}
                  >
                    {item.label}
                    {isActive ? <span aria-hidden="true" className="size-1.5 rotate-45 bg-[var(--primary-color)]" /> : null}
                  </Link>
                </DrawerClose>
              );
            })}

            {/* Ngôn ngữ: chọn thẳng VI / EN, không phải mở thêm danh sách */}
            <div className="flex min-h-14 items-center justify-between gap-4">
              <span className="font-[family-name:var(--font-lora)] text-[13px] uppercase tracking-[1.5px] text-[var(--text-light)]">
                {languageLabel}
              </span>
              <div role="group" aria-label={languageLabel} className="flex border border-[var(--border)]">
                {locales.map((loc) => {
                  const isSelected = loc === currentLocale;
                  return (
                    <button
                      key={loc}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectLanguage(loc)}
                      disabled={isPending}
                      className={cn(
                        'h-8 min-w-11 cursor-pointer px-3 text-xs font-semibold uppercase tracking-[1px] transition-colors disabled:cursor-wait',
                        isSelected ? 'bg-[var(--primary-color)] text-white' : 'text-[var(--text-light)] hover:text-primary-ink',
                      )}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Chân drawer cố định: tài khoản / đăng nhập — chừa vùng an toàn đáy màn hình (iPhone) */}
          <div className="grid shrink-0 gap-2.5 border-t border-[var(--border)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            {userName ? (
              <>
                <DrawerClose asChild>
                  <ActionLink href={isAdmin ? '/admin/dashboard' : '/profile'} variant="confirm" size="md" fullWidth icon={<UserRound />}>
                    {isAdmin ? adminLabel : profileLabel}
                  </ActionLink>
                </DrawerClose>
                {!isAdmin && (
                  <ActionButton variant="cancel" size="md" fullWidth icon={<LogOut />} onClick={handleLogout}>
                    {logoutLabel}
                  </ActionButton>
                )}
              </>
            ) : (
              <DrawerClose asChild>
                <ActionLink href="/login" variant="confirm" size="md" fullWidth icon={<UserRound />}>
                  {loginLabel}
                </ActionLink>
              </DrawerClose>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <LogoutDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen} beforeRedirect={logoutAdminToo} />
    </div>
  );
}
