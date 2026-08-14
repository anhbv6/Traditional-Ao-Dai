'use client';

import { ArrowRight, Check, LogOut, Menu, Minus, Plus, UserRound } from 'lucide-react';
import { Link, usePathname, useRouter, routing } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useState, useTransition } from 'react';
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
import { SearchBar } from './SearchBar';
import { Logo } from './Logo';
import type { NavItem } from './types';
import { logoutApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { clearBrowserAuthTokens } from '@/lib/api-client';

type MobileMenuProps = {
  items: NavItem[];
  searchPlaceholder?: string;
  loginLabel?: string;
  profileLabel?: string;
  logoutLabel?: string;
  wishlistCount?: number;
  languageLabel?: string;
  taglineDrawer?: string;
};

export function MobileMenu({
  items,
  searchPlaceholder = 'Search...',
  loginLabel = 'Login',
  profileLabel = 'Profile',
  logoutLabel = 'Logout',
  wishlistCount = 0,
  languageLabel = 'Ngôn ngữ',
  taglineDrawer,
}: MobileMenuProps) {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isAuthenticated, user, logout: storeLogout } = useAuthStore();
  const userName = user?.name || user?.email || (isAuthenticated ? 'Account' : undefined);

  const handleSelectLanguage = (newLocale: string) => {
    if (newLocale === currentLocale || isPending) return;
    setIsDrawerOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  const locales = routing.locales;

  const handleLogout = () => {
    setIsDrawerOpen(false);
    startTransition(async () => {
      try {
        await logoutApi();
      } catch {
        // Local logout should still complete if the server session is already gone.
      } finally {
        clearBrowserAuthTokens();
        storeLogout();
        router.push('/login');
        router.refresh();
      }
    });
  };

  return (
    <div className="lg:hidden">
      <Drawer direction="right" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-md text-primary transition-colors hover:bg-secondary"
            aria-label="Open navigation"
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex flex-col items-start gap-1">
              <DrawerTitle>
                <Logo />
              </DrawerTitle>
              <DrawerDescription className="mt-1 text-sm font-semibold tracking-wide font-[family-name:var(--font-dancing)] text-primary leading-relaxed">
                &ldquo;{taglineDrawer}&rdquo;
              </DrawerDescription>
            </div>
            <DrawerCloseButton />
          </DrawerHeader>

          <div className="flex-1 flex flex-col justify-between overflow-y-auto px-5 pb-5">
            <div>
              <div className="py-5">
                <SearchBar
                  compact={false}
                  placeholder={searchPlaceholder}
                />
              </div>

              <nav className="grid gap-1" aria-label="Mobile navigation">
                {items.map((item) => (
                  <DrawerClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="group flex min-h-12 items-center justify-between border-b border-secondary py-3 text-sm font-normal uppercase tracking-[1px] text-foreground transition-colors hover:text-primary"
                    >
                      <span className="font-[family-name:var(--font-lora)]">
                        {item.label}
                        {item.href === '/wishlist' && wishlistCount > 0 ? (
                          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                            {wishlistCount}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </DrawerClose>
                ))}

                {/* Mục Ngôn ngữ với Icon Dấu Plus (+) xổ xuống danh sách lựa chọn */}
                <div className="border-b border-secondary py-1">
                  <button
                    type="button"
                    onClick={() => setIsLangOpen((prev) => !prev)}
                    className="flex min-h-12 w-full items-center justify-between py-2 text-sm font-normal uppercase tracking-[1px] text-foreground transition-colors hover:text-primary"
                    aria-expanded={isLangOpen}
                  >
                    <span className="font-[family-name:var(--font-lora)]">
                      {languageLabel} ({currentLocale.toUpperCase()})
                    </span>
                    <span className="grid h-8 w-8 place-items-center text-primary transition-colors">
                      {isLangOpen ? <Minus size={16} strokeWidth={1.8} /> : <Plus size={16} strokeWidth={1.8} />}
                    </span>
                  </button>

                  {/* Submenu danh sách ngôn ngữ khi bấm nút Plus */}
                  {isLangOpen && (
                    <div className="my-2 ml-2 flex flex-col gap-1.5 border-l-2 border-primary/30 pl-4 py-1">
                      {locales.map((loc) => {
                        const isSelected = loc === currentLocale;
                        const langName = loc === 'vi' ? 'Tiếng Việt' : 'English';

                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => handleSelectLanguage(loc)}
                            disabled={isPending}
                            className={[
                              'flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors',
                              isSelected
                                ? 'bg-background text-primary '
                                : 'text-muted-foreground hover:bg-background hover:text-primary',
                            ].join(' ')}
                          >
                            <span>{langName} ({loc.toUpperCase()})</span>
                            {isSelected && <Check size={14} className="text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Account / Login & Shop Now */}
            <div className="mt-6 grid gap-3">
              {userName ? (
                <>
                  <DrawerClose asChild>
                    <Link
                      href="/profile"
                      className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#111018]"
                    >
                      <UserRound size={16} strokeWidth={1.5} />
                      {profileLabel}
                    </Link>
                  </DrawerClose>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isPending}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-secondary px-4 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:text-primary disabled:opacity-60"
                  >
                    <LogOut size={16} strokeWidth={1.5} />
                    {logoutLabel}
                  </button>
                </>
              ) : (
                <DrawerClose asChild>
                  <Link
                    href="/login"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#111018]"
                  >
                    <UserRound size={16} strokeWidth={1.5} />
                    {loginLabel}
                  </Link>
                </DrawerClose>
              )}

              <DrawerClose asChild>
                <Link
                  href="/products"
                  className="flex min-h-12 items-center justify-between rounded-md bg-[#111018] px-4 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-primary"
                >
                  Shop now
                  <ArrowRight size={16} strokeWidth={1.8} />
                </Link>
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
