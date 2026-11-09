"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
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
 * Vùng hiện toast (góc trên bên phải). Vị trí / bề rộng riêng của từng khu truyền qua `className` (xem AREA_CLASS):
 * - Storefront CÓ header dính: nằm ngay dưới header — `HeaderHeightSync` gắn `data-site-header` lên <html> và ghi chiều cao
 *   thật vào `--site-header-h`, nên không che logo / giỏ hàng / nút đăng nhập dù header đổi cao theo breakpoint.
 * - Trang KHÔNG có header (đăng nhập, 403…) và khu admin: sát góc trên như thông thường.
 */
function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={(state) =>
        cn(
          "pointer-events-none fixed inset-x-3 top-3 z-[9999] outline-none sm:left-auto sm:right-6 sm:top-5",
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
          "group/toast pointer-events-auto absolute right-0 top-0 z-[calc(1000-var(--toast-index))] w-full origin-top overflow-hidden outline-none select-none",
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
        cn("flex h-full items-start gap-3 overflow-hidden", resolveClassName(className, state))
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
        cn("leading-5", resolveClassName(className, state))
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
        cn("mt-0.5 text-[13px] leading-5", resolveClassName(className, state))
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
          "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 px-2 transition-colors",
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
          "relative size-7 shrink-0 transition-colors after:absolute after:-inset-1 after:content-['']",
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

type ToastArea = "store" | "admin"

const TOAST_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  success: CircleCheckIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
  error: OctagonXIcon,
  loading: Loader2Icon,
  undo: Undo2Icon,
}

/**
 * Màu theo loại thông báo, riêng cho từng khu:
 * - store: tông thương hiệu (đỏ đô cho thông tin), icon nằm trong vòng tròn nền nhạt, vạch đếm ngược cùng màu.
 * - admin: đơn sắc — chỉ icon mang màu ngữ nghĩa (emerald / amber / rose), theo AGENTS.md §8.
 */
const TONES: Record<ToastArea, Record<string, { icon: string; badge?: string; bar: string }>> = {
  store: {
    success: { icon: "text-emerald-700 dark:text-emerald-400", badge: "bg-emerald-700/10 dark:bg-emerald-400/15", bar: "bg-emerald-700/60 dark:bg-emerald-400/60" },
    info: { icon: "text-[var(--primary-ink)]", badge: "bg-[var(--primary-color)]/10", bar: "bg-[var(--primary-color)]/50" },
    warning: { icon: "text-amber-700 dark:text-amber-400", badge: "bg-amber-600/12 dark:bg-amber-400/15", bar: "bg-amber-600/60" },
    error: { icon: "text-[var(--destructive)]", badge: "bg-[var(--destructive)]/10", bar: "bg-[var(--destructive)]/60" },
    loading: { icon: "text-[var(--text-light)]", badge: "bg-[var(--bg-secondary)]", bar: "bg-[var(--border)]" },
    undo: { icon: "text-[var(--primary-ink)]", badge: "bg-[var(--primary-color)]/10", bar: "bg-[var(--primary-color)]/50" },
  },
  admin: {
    success: { icon: "text-emerald-600", bar: "bg-emerald-500/50" },
    info: { icon: "text-[#09090B]", bar: "bg-[#18181B]/25" },
    warning: { icon: "text-amber-600", bar: "bg-amber-500/50" },
    error: { icon: "text-rose-600", bar: "bg-rose-500/50" },
    loading: { icon: "text-[#71717A]", bar: "bg-[#E4E4E7]" },
    undo: { icon: "text-[#71717A]", bar: "bg-[#18181B]/25" },
  },
}

/** Kiểu từng phần của thẻ thông báo theo khu */
const AREA_CLASS: Record<
  ToastArea,
  { viewport: string; root: string; content: string; title: string; description: string; action: string; close: string }
> = {
  store: {
    viewport: "sm:w-[23rem] [html[data-site-header]_&]:top-[calc(var(--site-header-h)+0.75rem)]",
    root: "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] shadow-[0_20px_44px_-22px_rgba(80,10,28,0.45)]",
    content: "items-center gap-3.5 px-4 py-3.5",
    title: "text-sm font-semibold text-[var(--text-main)]",
    description: "text-[var(--text-light)]",
    action:
      "-ml-2 mt-1.5 self-start text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--primary-ink)] hover:bg-[var(--bg-secondary)]",
    close: "-mr-1.5 rounded-none text-[var(--text-light)] hover:bg-transparent hover:text-[var(--primary-ink)]",
  },
  admin: {
    viewport: "sm:right-5 sm:top-5 sm:w-[22rem]",
    root: "admin-shell rounded-xl border border-[#E4E4E7] bg-white font-[family-name:var(--font-admin)] text-[#09090B] shadow-[0_12px_32px_-12px_rgba(9,9,11,0.22)]",
    content: "items-center p-3.5 pr-2.5",
    title: "text-sm font-medium text-[#09090B]",
    description: "text-[#71717A]",
    action: "-ml-2 mt-1.5 self-start rounded-md text-xs font-medium text-[#09090B] hover:bg-[#F4F4F5]",
    close: "rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]",
  },
}

function ToastIcon({ type, area }: { type: string | undefined; area: ToastArea }) {
  const Icon = TOAST_ICONS[type ?? ""]
  const tone = TONES[area][type ?? ""]
  if (!Icon || !tone) return null
  const spin = type === "loading" && "animate-spin"

  if (area === "admin") {
    return (
      <span data-slot="toast-icon" className="flex h-5 shrink-0 items-center">
        <Icon className={cn("size-[18px]", tone.icon, spin)} aria-hidden="true" />
      </span>
    )
  }
  return (
    <span data-slot="toast-icon" className={cn("grid size-9 shrink-0 place-items-center rounded-full", tone.badge)}>
      <Icon className={cn("size-[18px]", tone.icon, spin)} aria-hidden="true" />
    </span>
  )
}

function ToastList({ area }: { area: ToastArea }) {
  const { toasts } = ToastPrimitive.useToastManager()
  const styles = AREA_CLASS[area]

  return toasts.map((toastItem) => {
    const tone = TONES[area][toastItem.type ?? ""]
    return (
      <Toast key={toastItem.id} toast={toastItem} className={styles.root}>
        <ToastContent className={styles.content}>
          <ToastIcon type={toastItem.type} area={area} />
          {/* Nút hành động (Hoàn tác) nằm dưới nội dung — chữ được trọn bề rộng, không bị bóp thành nhiều dòng */}
          <div className="flex min-w-0 flex-1 flex-col select-none">
            {toastItem.title && <ToastTitle className={styles.title} />}
            {toastItem.description && <ToastDescription className={styles.description} />}
            {toastItem.actionProps ? <ToastAction className={styles.action} /> : null}
          </div>
          <ToastClose className={styles.close} />
        </ToastContent>
        {/* Vạch đếm ngược co dần ở đáy — chỉ cho thông báo có Hoàn tác (biết còn bao lâu để bấm);
            tạm dừng khi rê chuột vào vùng thông báo. Thông báo thường giữ tĩnh, gọn. */}
        {tone && toastItem.timeout && toastItem.type === "undo" ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 bottom-0 h-0.5 origin-left [[data-slot=toast-viewport]:hover_&]:[animation-play-state:paused]",
              tone.bar
            )}
            style={{ animation: `progress-fill ${toastItem.timeout}ms linear reverse forwards` }}
          />
        ) : null}
      </Toast>
    )
  })
}

/** Khu quản trị: `/admin` hoặc `/<locale>/admin/...` */
const ADMIN_PATH = /^\/(?:[a-z]{2}\/)?admin(?:\/|$)/

function Toaster({
  children,
  toastManager = toast,
  ...props
}: ToastPrimitive.Provider.Props) {
  // Toast gắn vào <body> qua portal (nằm ngoài khung .admin-shell) nên chọn kiểu theo đường dẫn hiện tại
  const area: ToastArea = ADMIN_PATH.test(usePathname() ?? "") ? "admin" : "store"

  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport className={AREA_CLASS[area].viewport}>
          <ToastList area={area} />
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
