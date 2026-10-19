import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Hoạ tiết phân cách: hai nét mảnh + hình thoi ở giữa (gợi đường viền gấm cổ) — dùng chung cho storefront.
 * - Mặc định: gọn (hai nét 40px) — đặt dưới tiêu đề, eyebrow.
 * - `fullWidth`: hai nét kéo dài hết chiều ngang, thoi ở giữa — thay cho vạch kẻ ngang (border) giữa các khối.
 */
export function SectionOrnament({ className, fullWidth = false }: { className?: string; fullWidth?: boolean }) {
  const line = cn('h-px bg-current opacity-60', fullWidth ? 'flex-1' : 'w-10');
  return (
    <span aria-hidden="true" className={cn('flex items-center gap-2 text-[var(--accent-color)]', fullWidth && 'w-full', className)}>
      <span className={line} />
      <span className="size-1.5 shrink-0 rotate-45 border border-current" />
      <span className={line} />
    </span>
  );
}
