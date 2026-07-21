'use client';

import { ChevronDown } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import type { NavItem } from './types';

type DesktopNavProps = {
  items: NavItem[];
};

export function DesktopNav({ items }: DesktopNavProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'relative flex items-center gap-1.5 py-1 text-[14px] uppercase tracking-[1px] font-[family-name:var(--font-lora)] transition-colors duration-200',
              isActive
                ? 'text-[#800020] font-semibold after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:bg-[#800020]'
                : 'text-[#2A2525] font-normal hover:text-[#800020] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-[#800020] hover:after:w-full after:transition-all after:duration-200',
            ].join(' ')}
          >
            {item.label}
            {item.hasDropdown ? <ChevronDown size={14} strokeWidth={1.5} className="text-current" aria-hidden="true" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
