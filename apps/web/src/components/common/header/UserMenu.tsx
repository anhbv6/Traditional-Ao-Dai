'use client';

import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { Link } from '@/i18n/routing';

type UserMenuProps = {
  loginLabel?: string;
  profileLabel?: string;
  ordersLabel?: string;
  userName?: string;
};

export function UserMenu({
  loginLabel = 'Login',
  profileLabel = 'Profile',
  ordersLabel = 'Orders',
  userName,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

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
        </div>
      ) : null}
    </div>
  );
}
