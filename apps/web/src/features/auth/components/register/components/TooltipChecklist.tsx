import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TooltipChecklistItem {
  label: string;
  isValid: boolean;
}

export interface TooltipChecklistProps {
  items: TooltipChecklistItem[];
}

export function TooltipChecklist({ items }: TooltipChecklistProps) {
  return (
    <ul className="w-full space-y-1.5 text-[11px] font-[family-name:var(--font-lora)] text-zinc-300 py-1 px-0.5 select-none sm:min-w-[220px]">
      {items.map((item, idx) => (
        <li
          key={idx}
          className={cn(
            "flex items-start gap-1.5 transition-all duration-200",
            item.isValid ? "text-green-400 font-semibold" : "text-zinc-400"
          )}
        >
          {item.isValid ? (
            <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-green-400" />
          ) : (
            <div className="size-1 rounded-full bg-zinc-500 mt-1.5 ml-1 shrink-0" />
          )}
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
