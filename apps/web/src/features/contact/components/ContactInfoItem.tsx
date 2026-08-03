"use client";

import { type LucideIcon } from 'lucide-react';

interface ContactInfoItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}

export function ContactInfoItem({
  icon: Icon,
  label,
  value,
  href,
}: ContactInfoItemProps) {
  const content = (
    <div className="group flex gap-3 sm:gap-4 border-b border-[var(--border)] py-4 sm:py-5 last:border-b-0">
      <span className="grid size-10 sm:size-11 shrink-0 place-items-center rounded-md bg-[var(--bg-secondary)] text-[var(--primary-color)] transition-colors group-hover:bg-[var(--primary-color)] group-hover:text-white">
        <Icon className="size-[17px] sm:size-[19px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] sm:text-xs font-semibold uppercase text-[var(--text-light)]">{label}</span>
        <span className="mt-1 block text-sm sm:text-base font-semibold leading-7 text-[var(--text-main)]">{value}</span>
      </span>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} className="block">
      {content}
    </a>
  );
}
