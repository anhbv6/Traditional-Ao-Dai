import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-11 w-full rounded-lg border border-[#F3ECE7] bg-[#FAF7F5] px-3 py-2 text-sm text-[#2A2525] shadow-none outline-none transition-colors placeholder:text-[#706565]',
        'selection:bg-[#800020] selection:text-white',
        'focus:border-[#800020] focus:bg-white focus:ring-2 focus:ring-[#E2A79E]/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
