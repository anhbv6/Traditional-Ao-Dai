import type { ComponentType } from 'react';

export type NavItem = {
  label: string;
  href: string;
  hasDropdown?: boolean;
  /** Menu desktop lg → 2xl chật chỗ (nhãn tiếng Việt dài): mục phụ chỉ hiện từ 2xl (drawer mobile vẫn hiện đủ) */
  desktopFrom2xl?: boolean;
};

export type HeaderActionIcon = ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;
