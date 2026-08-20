import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full rounded-lg border border-border bg-background px-3 py-1.5 font-[family-name:var(--font-lora)] text-base text-foreground shadow-none outline-none transition-colors placeholder:text-xs sm:placeholder:text-sm placeholder:text-muted-foreground sm:h-11 sm:text-sm',
        'selection:bg-primary selection:text-primary-foreground',
        'focus:border-primary focus:bg-white focus:ring-2 focus:ring-ring/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
