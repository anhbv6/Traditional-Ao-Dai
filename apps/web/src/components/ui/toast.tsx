"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon, Undo2Icon } from "lucide-react"

const toast = ToastPrimitive.createToastManager()

/**
 * Thời gian hiển thị (ms). Đủ đọc 1–2 dòng rồi tự tắt; rê chuột vào vùng thông báo thì tạm dừng đếm.
 * - Thành công / thông tin: ngắn. Lỗi: dài hơn để kịp đọc. Hoàn tác: đủ thời gian bấm.
 */
export const TOAST_DURATION = {
  success: 3500,
  info: 3500,
  warning: 4500,
  error: 5000,
  loading: 8000,
  undo: 5000,
} as const

/** Thời gian (ms) cho phép hoàn tác — dùng chung cho mọi thao tác có nút "Hoàn tác" */
export const UNDO_TIMEOUT = TOAST_DURATION.undo

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

/**
 * Vùng hiện toast (góc trên bên phải):
 * - Trang CÓ header dính: nằm ngay dưới header — `HeaderHeightSync` gắn `data-site-header` lên <html> và ghi chiều cao
 *   thật vào `--site-header-h`, nên không che logo / giỏ hàng / nút đăng nhập dù header đổi cao theo breakpoint.
 * - Trang KHÔNG có header (đăng nhập, 403…): sát góc trên như thông thường.
 */
function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={(state) =>
        cn(
          "pointer-events-none fixed inset-x-3 top-3 z-[9999] outline-none sm:left-auto sm:right-6 sm:top-5 sm:w-[22rem]",
          "[html[data-site-header]_&]:top-[calc(var(--site-header-h)+0.75rem)]",
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
          "group/toast pointer-events-auto absolute right-0 top-0 z-[calc(1000-var(--toast-index))] w-full origin-top overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] shadow-[0_14px_36px_-18px_rgba(42,37,37,0.32)] outline-none select-none",
          "[--gap:0.5rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*1+calc(var(--toast-index)*var(--gap)*1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
          "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_400ms_cubic-bezier(0.22,1,0.36,1),opacity_400ms,height_150ms]",
          "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
          "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
          /* Vào: nhích nhẹ xuống + hiện dần (không bay từ ngoài màn hình). Ra: mờ dần + nhích lên */
          "data-limited:opacity-0 data-starting-style:opacity-0 data-starting-style:[transform:translateY(-0.75rem)_scale(0.98)]",
          "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:opacity-0 [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(-0.5rem)_scale(0.98)]",
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
          "flex h-full items-start gap-3 overflow-hidden py-3 pl-4 pr-2",
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
        cn("text-[13px] font-semibold leading-5 text-[var(--text-main)]", resolveClassName(className, state))
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
        cn("text-xs leading-5 text-[var(--text-light)]", resolveClassName(className, state))
      }
      {...props}
    />
  )
}

/** Nút hành động trong toast (VD "Hoàn tác") — dạng chữ, không viền, để không giành chú ý với nội dung */
function ToastAction({ className, ...props }: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      className={(state) =>
        cn(
          "-my-0.5 inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 px-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--primary-ink)] transition-colors hover:bg-[var(--bg-secondary)]",
          resolveClassName(className, state)
        )
      }
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
          "relative -my-0.5 size-7 shrink-0 rounded-none text-[var(--text-light)] transition-colors hover:bg-transparent hover:text-[var(--text-main)] after:absolute after:-inset-1 after:content-['']",
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

/** Biểu tượng + màu nhấn theo loại thông báo — tông trầm, chỉ icon và vạch trái có màu (không tô cả nền) */
const TOAST_TONES: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bar: string }> = {
  success: { icon: CircleCheckIcon, color: "text-emerald-700 dark:text-emerald-400", bar: "bg-emerald-700/70 dark:bg-emerald-400/70" },
  info: { icon: InfoIcon, color: "text-[var(--primary-ink)]", bar: "bg-[var(--primary-color)]/60" },
  warning: { icon: TriangleAlertIcon, color: "text-amber-700 dark:text-amber-400", bar: "bg-amber-600/70" },
  error: { icon: OctagonXIcon, color: "text-[var(--destructive)]", bar: "bg-[var(--destructive)]/70" },
  loading: { icon: Loader2Icon, color: "text-[var(--text-light)]", bar: "bg-[var(--border)]" },
  undo: { icon: Undo2Icon, color: "text-[var(--text-light)]", bar: "bg-[var(--text-light)]/40" },
}

function ToastIcon({ type }: { type: string | undefined }) {
  const tone = TOAST_TONES[type ?? ""]
  if (!tone) return null
  const Icon = tone.icon

  return (
    <span data-slot="toast-icon" className="flex h-5 shrink-0 items-center">
      <Icon className={cn("size-4", tone.color, type === "loading" && "animate-spin")} aria-hidden="true" />
    </span>
  )
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toastItem) => {
    const tone = TOAST_TONES[toastItem.type ?? ""]
    return (
      <Toast key={toastItem.id} toast={toastItem}>
        {/* Vạch màu mảnh bên trái cho biết loại thông báo */}
        {tone ? <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-0.5", tone.bar)} /> : null}
        <ToastContent>
          <ToastIcon type={toastItem.type} />
          <div className="flex min-w-0 flex-1 flex-col select-none">
            {toastItem.title && <ToastTitle />}
            {toastItem.description && <ToastDescription />}
          </div>
          {toastItem.actionProps ? <ToastAction /> : null}
          <ToastClose />
        </ToastContent>
        {/* Thông báo có hoàn tác: vạch đếm ngược co dần ở đáy (tạm dừng khi rê chuột vào vùng thông báo) */}
        {toastItem.type === "undo" && toastItem.timeout ? (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[var(--primary-color)]/40 [[data-slot=toast-viewport]:hover_&]:[animation-play-state:paused]"
            style={{ animation: `progress-fill ${toastItem.timeout}ms linear reverse forwards` }}
          />
        ) : null}
      </Toast>
    )
  })
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

export interface UndoToastOptions {
  /** Nội dung chính, VD "Đã xóa “Áo dài Hoa Sen” khỏi giỏ hàng" */
  title: string
  description?: string
  /** Chữ trên nút — truyền nhãn đã dịch (VD t("actions.undo")) */
  actionLabel: string
  /** Khôi phục lại trạng thái trước thao tác */
  onUndo: () => void
  timeout?: number
}

interface ShowToast {
  (message: string, description?: string): string
  success: (message: string, description?: string) => string
  error: (message: string, description?: string) => string
  info: (message: string, description?: string) => string
  warning: (message: string, description?: string) => string
  loading: (message: string, description?: string) => string
  /**
   * Thông báo kèm nút "Hoàn tác" cho thao tác đảo ngược được (xóa khỏi giỏ, bỏ yêu thích, đánh dấu đã đọc…).
   * Bấm "Hoàn tác" -> gọi `onUndo` rồi đóng thông báo. Trả về id để tự đóng sớm khi cần.
   */
  undo: (options: UndoToastOptions) => string
  /** Đóng một thông báo theo id */
  dismiss: (id: string) => void
}

const addToast = (type: Exclude<keyof typeof TOAST_DURATION, "undo">) => (message: string, description?: string) =>
  toast.add({ title: message, description, type, timeout: TOAST_DURATION[type] })

export const showToast: ShowToast = Object.assign(addToast("info"), {
  success: addToast("success"),
  error: addToast("error"),
  info: addToast("info"),
  warning: addToast("warning"),
  loading: addToast("loading"),
  undo: ({ title, description, actionLabel, onUndo, timeout = TOAST_DURATION.undo }: UndoToastOptions) => {
    // Gán id trước để nút hoàn tác đóng đúng thông báo của nó
    const id = `undo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    return toast.add({
      id,
      title,
      description,
      type: "undo",
      timeout,
      priority: "high",
      actionProps: {
        children: (
          <>
            <Undo2Icon className="size-3.5" aria-hidden="true" />
            {actionLabel}
          </>
        ),
        onClick: () => {
          onUndo()
          toast.close(id)
        },
      },
    })
  },
  dismiss: (id: string) => toast.close(id),
})

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
