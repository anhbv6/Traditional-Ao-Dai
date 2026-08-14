'use client';

import { useState, useTransition } from 'react';
import { LogOut, UserRound } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { logoutApi } from '@/features/auth/api/auth.api';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { clearBrowserAuthTokens } from '@/lib/api-client';

type UserMenuProps = {
  loginLabel?: string;
  profileLabel?: string;
  ordersLabel?: string;
  logoutLabel?: string;
  userName?: string;
};

export function UserMenu({
  loginLabel = 'Login',
  profileLabel = 'Profile',
  ordersLabel = 'Orders',
  logoutLabel = 'Logout',
  userName: initialUserName,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { isAuthenticated, user } = useCurrentUser();
  const userName = initialUserName || user?.name || user?.email || (isAuthenticated ? 'Account' : undefined);

  const handleLogout = () => {
    setIsOpen(false);
    startTransition(async () => {
      const refreshToken = localStorage.getItem('refreshToken') || undefined;
      try {
        await logoutApi(refreshToken);
      } catch {
        // Local logout should still complete if the server session is already gone.
      } finally {
        clearBrowserAuthTokens();
        router.push('/login');
        router.refresh();
      }
    });
  };

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
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="grid h-11 w-11 place-items-center text-primary transition-opacity hover:opacity-75"
        aria-expanded={isOpen}
        aria-label={profileLabel}
      >
        <UserRound size={22} strokeWidth={1.5} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-12 w-44 border border-secondary bg-background p-2 shadow-lg">
          <Link href="/profile" className="block px-3 py-2 text-sm font-semibold text-foreground hover:text-primary">
            {profileLabel}
          </Link>
          <Link href="/profile/orders" className="block px-3 py-2 text-sm font-semibold text-foreground hover:text-primary">
            {ordersLabel}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-foreground hover:text-primary disabled:opacity-60"
          >
            <LogOut size={15} strokeWidth={1.6} />
            {logoutLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
