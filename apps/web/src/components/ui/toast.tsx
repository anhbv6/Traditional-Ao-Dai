"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const toast = ToastPrimitive.createToastManager()

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />
}

function resolveClassName<T>(
  className: string | ((state: T) => string | undefined) | undefined,
  state: T
): string | undefined {
  return typeof className === "function" ? className(state) : className
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={(state) =>
        cn(
          "pointer-events-none fixed right-[2rem] top-[2rem] z-[9999] w-[calc(100vw-4rem)] sm:w-[22.5rem] outline-none",
          resolveClassName(className, state)
        )
      }
      {...props}
    />
  )
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={(state) =>
        cn(
          "group/toast pointer-events-auto absolute right-0 top-0 z-[calc(1000-var(--toast-index))] w-full origin-top rounded-2xl border bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 border-zinc-200 dark:border-zinc-800 shadow-lg outline-none select-none",
          "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*1+calc(var(--toast-index)*var(--gap)*1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
          "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
          "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
          "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
          "data-limited:opacity-0 data-starting-style:[transform:translateY(-150%)]",
          "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(-150%)]",
          "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
          "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
          "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
          "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
          "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
          "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
          "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
          "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
          resolveClassName(className, state)
        )
      }
      {...props}
    />
  )
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={(state) =>
        cn(
          "flex items-center gap-3 overflow-hidden p-4 h-full",
          resolveClassName(className, state)
        )
      }
      {...props}
    />
  )
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={(state) =>
        cn("text-xs font-semibold leading-relaxed text-black dark:text-white", resolveClassName(className, state))
      }
      {...props}
    />
  )
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={(state) =>
        cn("text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal", resolveClassName(className, state))
      }
      {...props}
    />
  )
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={(state) => cn("shrink-0", resolveClassName(className, state))}
      {...props}
    />
  )
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={(state) =>
        cn(
          "relative shrink-0 text-zinc-400 hover:text-black dark:text-zinc-500 dark:hover:text-zinc-300 after:absolute after:-inset-2 after:content-[''] transition-colors",
          resolveClassName(className, state)
        )
      }
      {...props}
    >
      {children ?? (
        <XIcon className="size-4" aria-hidden="true" />
      )}
    </ToastPrimitive.Close>
  )
}

function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode = null

  if (type === "success") {
    icon = (
      <CircleCheckIcon className="text-black dark:text-white size-4 shrink-0" aria-hidden="true" />
    )
  }

  if (type === "info") {
    icon = (
      <InfoIcon className="text-black dark:text-white size-4 shrink-0" aria-hidden="true" />
    )
  }

  if (type === "warning") {
    icon = (
      <TriangleAlertIcon className="text-black dark:text-white size-4 shrink-0" aria-hidden="true" />
    )
  }

  if (type === "error") {
    icon = (
      <OctagonXIcon className="text-black dark:text-white size-4 shrink-0" aria-hidden="true" />
    )
  }

  if (type === "loading") {
    icon = (
      <Loader2Icon className="animate-spin text-black dark:text-white size-4 shrink-0" aria-hidden="true" />
    )
  }

  if (!icon) {
    return null
  }

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0 flex items-center"
    >
      {icon}
    </span>
  )
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 select-none">
          {toastItem.title && <ToastTitle className="text-xs font-bold font-[family-name:var(--font-lora)] text-black dark:text-white" />}
          {toastItem.description && <ToastDescription className="text-[11px] text-muted-foreground font-[family-name:var(--font-lora)]" />}
        </div>
        <ToastClose />
      </ToastContent>
    </Toast>
  ))
}

function Toaster({
  children,
  toastManager = toast,
  ...props
}: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

// Compatibility layer for showToast calls with 20 second timeout
interface ShowToast {
  (message: string, description?: string): void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  loading: (message: string, description?: string) => void;
}

export const showToast = Object.assign(
  (message: string, description?: string) => {
    toast.add({
      title: message,
      description,
      type: 'info',
      timeout: 20000,
    });
  },
  {
    success: (message: string, description?: string) => {
      toast.add({
        title: message,
        description,
        type: 'success',
        timeout: 20000,
      });
    },
    error: (message: string, description?: string) => {
      toast.add({
        title: message,
        description,
        type: 'error',
        timeout: 20000,
      });
    },
    info: (message: string, description?: string) => {
      toast.add({
        title: message,
        description,
        type: 'info',
        timeout: 20000,
      });
    },
    loading: (message: string, description?: string) => {
      toast.add({
        title: message,
        description,
        type: 'loading',
        timeout: 20000,
      });
    },
  }
) as ShowToast;

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
}
