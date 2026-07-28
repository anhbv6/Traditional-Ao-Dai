'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

function Drawer({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />;
}

function DrawerTrigger(props: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger {...props} />;
}

function DrawerPortal(props: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal {...props} />;
}

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      className={cn('fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]', className)}
      {...props}
    />
  );
}

type DrawerContentProps = React.ComponentProps<typeof DrawerPrimitive.Content> & {
  direction?: 'top' | 'right' | 'bottom' | 'left';
};

function DrawerContent({
  className,
  children,
  direction = 'right',
  ...props
}: DrawerContentProps) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col bg-[var(--bg-main)] shadow-2xl outline-none',
          direction === 'right' &&
            'bottom-0 right-0 top-0 h-full w-[min(88vw,390px)] border-l border-[color:var(--bg-secondary)]',
          direction === 'left' &&
            'bottom-0 left-0 top-0 h-full w-[min(88vw,390px)] border-r border-[color:var(--bg-secondary)]',
          direction === 'bottom' &&
            'bottom-0 left-0 right-0 max-h-[88vh] rounded-t-lg border-t border-[color:var(--bg-secondary)]',
          direction === 'top' &&
            'left-0 right-0 top-0 max-h-[88vh] rounded-b-lg border-b border-[color:var(--bg-secondary)]',
          className,
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-start justify-between gap-4 px-5 pb-3 pt-5 border-b border-[#E2A79E]/35', className)} {...props} />;
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      className={cn(
        'font-[family-name:var(--font-playfair)] text-2xl font-semibold uppercase tracking-[1px] text-[var(--primary-color)]',
        className,
      )}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      className={cn('text-sm leading-6 text-[var(--text-light)]', className)}
      {...props}
    />
  );
}

function DrawerCloseButton({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return (
    <DrawerPrimitive.Close
      className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-md text-[var(--text-main)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-color)]',
        className,
      )}
      {...props}
    >
      <X size={20} strokeWidth={1.8} aria-hidden="true" />
      <span className="sr-only">Close</span>
    </DrawerPrimitive.Close>
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
