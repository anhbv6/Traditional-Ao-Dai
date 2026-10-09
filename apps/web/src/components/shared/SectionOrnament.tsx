import React from 'react';
import { cn } from '@/lib/utils';

/** Hoạ tiết phân cách: hai nét mảnh + hình thoi ở giữa (gợi đường viền gấm cổ) — dùng chung cho storefront */
export function SectionOrnament({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('flex items-center gap-2 text-[var(--accent-color)]', className)}>
      <span className="h-px w-10 bg-current opacity-60" />
      <span className="size-1.5 rotate-45 border border-current" />
      <span className="h-px w-10 bg-current opacity-60" />
    </span>
  );
}
