import type { ComponentType } from 'react';

export type NavItem = {
  label: string;
  href: string;
  hasDropdown?: boolean;
};

export type HeaderActionIcon = ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;
