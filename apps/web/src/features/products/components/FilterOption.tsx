'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOptionProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  /** `checkbox`: chọn nhiều · `radio`: chọn một (mức giá) */
  type?: 'checkbox' | 'radio';
  /** Số sản phẩm khớp — 0 thì làm mờ và khóa (trừ khi đang chọn) */
  count?: number;
  /** Phần tử đứng trước nhãn (ô màu…) */
  leading?: ReactNode;
}

/**
 * Một dòng lựa chọn trong bộ lọc Cửa hàng: ô tích / nút tròn + nhãn + số lượng mờ bên phải.
 * Cả dòng là vùng bấm (cao ≥ 36px) — dễ chạm trên mobile, gọn hơn chip khi cột lọc hẹp.
 */
export function FilterOption({ label, selected, onToggle, type = 'checkbox', count, leading }: FilterOptionProps) {
  const isEmpty = count === 0 && !selected;

  return (
    <button
      type="button"
      role={type}
      aria-checked={selected}
      onClick={onToggle}
      disabled={isEmpty}
      className={cn(
        'group/opt flex min-h-9 w-full cursor-pointer items-center gap-3 py-1 text-left text-sm transition-colors',
        selected ? 'text-[var(--primary-ink)]' : 'text-[var(--text-main)] hover:text-[var(--primary-ink)]',
        'disabled:cursor-not-allowed disabled:opacity-40'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-4 shrink-0 place-items-center border transition-colors',
          type === 'radio' ? 'rounded-full' : 'rounded-[3px]',
          selected
            ? 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white'
            : 'border-[var(--text-light)]/50 bg-[var(--bg-card)] group-hover/opt:border-[var(--primary-color)]'
        )}
      >
        {selected ? (
          type === 'radio' ? <span className="size-1.5 rounded-full bg-white" /> : <Check size={11} strokeWidth={3} />
        ) : null}
      </span>
      {leading}
      <span className={cn('min-w-0 flex-1 truncate', selected && 'font-semibold')}>{label}</span>
      {count !== undefined ? <span className="shrink-0 text-xs tabular-nums text-[var(--text-light)]">{count}</span> : null}
    </button>
  );
}
