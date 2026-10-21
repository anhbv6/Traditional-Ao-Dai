"use client";

import { useState, type ReactElement, type ReactNode, type RefObject } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { CircleCheck, Info, OctagonAlert, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ActionButton, type ActionColors } from "./ActionButton";

/* ============================================================================
 * KIỂU DỮ LIỆU
 * ========================================================================== */

/** Ngữ cảnh của hộp thoại — quyết định icon đầu và màu nút xác nhận */
export type AppDialogTone = "default" | "info" | "success" | "warning" | "danger";

/** Bề rộng trên desktop. Mobile (< sm) luôn là bottom sheet tràn ngang. */
export type AppDialogSize = "sm" | "md" | "lg" | "xl" | "full";

export interface AppDialogAction {
  /** Chữ trên nút — bỏ trống thì dùng nhãn mặc định đã dịch (Xác nhận / Huỷ) */
  label?: ReactNode;
  /**
   * Xử lý khi bấm. Trả về Promise → nút tự hiện loading, khoá đóng hộp thoại cho tới khi xong.
   * Xong (không lỗi) thì tự đóng; trả về `false` hoặc ném lỗi thì GIỮ hộp thoại mở (tự báo lỗi bằng useNotify bên trong).
   */
  onClick?: () => unknown | Promise<unknown>;
  /** Loading do bên ngoài điều khiển (VD form React Hook Form đang submit) */
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  /** id của <form> trong thân hộp thoại → nút thành type="submit" cho form đó (Enter trong ô nhập cũng submit) */
  form?: string;
}

export interface AppDialogProps {
  /* ---------- Trạng thái ---------- */
  /** Controlled: mở / đóng từ bên ngoài */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Uncontrolled: trạng thái ban đầu */
  defaultOpen?: boolean;
  /** Phần tử mở hộp thoại (uncontrolled) — truyền 1 element (VD <ActionButton />), Base UI gắn sự kiện + aria */
  trigger?: ReactElement;

  /* ---------- Nội dung ---------- */
  title: ReactNode;
  description?: ReactNode;
  /** Dòng chữ nhỏ viết hoa phía trên tiêu đề (VD "Xác nhận đơn hàng") */
  eyebrow?: ReactNode;
  tone?: AppDialogTone;
  /** Icon riêng thay icon theo `tone` (truyền `null` để ẩn) */
  icon?: LucideIcon | null;
  children?: ReactNode;

  /* ---------- Hành động ---------- */
  /** Nút xác nhận (chính) */
  confirm?: AppDialogAction;
  /** Nút huỷ — `false` để ẩn. Mặc định hiện khi có `confirm` */
  cancel?: AppDialogAction | false;
  /** Footer tự dựng — thay hoàn toàn cặp nút confirm / cancel */
  footer?: ReactNode;

  /* ---------- Hành vi ---------- */
  size?: AppDialogSize;
  /** false: không đóng bằng Esc / bấm ra ngoài / nút X (VD đang thanh toán) */
  dismissible?: boolean;
  /** Hiện nút X ở góc (mặc định theo `dismissible`) */
  showCloseButton?: boolean;
  /** Phần tử nhận focus khi mở (mặc định: phần tử tương tác đầu tiên) */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Gọi sau khi hiệu ứng đóng chạy xong — nơi an toàn để reset form */
  onClosed?: () => void;

  /* ---------- Tuỳ biến ---------- */
  className?: string;
  bodyClassName?: string;
}

/* ============================================================================
 * CẤU HÌNH GIAO DIỆN
 * ========================================================================== */

const SIZE_CLASS: Record<AppDialogSize, string> = {
  sm: "sm:w-[min(400px,calc(100vw-2rem))]",
  md: "sm:w-[min(520px,calc(100vw-2rem))]",
  lg: "sm:w-[min(680px,calc(100vw-2rem))]",
  xl: "sm:w-[min(880px,calc(100vw-2rem))]",
  full: "sm:h-[calc(100svh-4rem)] sm:w-[calc(100vw-4rem)]",
};

const TONE_ICON: Record<AppDialogTone, LucideIcon | null> = {
  default: null,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: OctagonAlert,
};

/** Màu icon theo tone (dùng token khi có, còn lại màu ngữ nghĩa cố định) */
const TONE_COLOR: Record<AppDialogTone, string> = {
  default: "var(--primary-ink)",
  info: "var(--primary-ink)",
  success: "#2F7D4F",
  warning: "#B7791F",
  danger: "#C81E3A",
};

/** Nút xác nhận của tone danger: đỏ cảnh báo thay vì đỏ đô thương hiệu */
const DANGER_COLORS: ActionColors = { bg: "#C81E3A", text: "#FFFFFF", border: "#C81E3A" };

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

/**
 * Hộp thoại dùng chung toàn storefront (xác nhận, form ngắn, thông báo, nội dung dài…).
 *
 * Giao diện: góc vuông, nền thẻ kem, vạch đỏ đô mảnh ở đỉnh, tiêu đề Playfair, icon trong khung thoi theo `tone`,
 * footer tách nền nhạt với nút ActionButton chung. Mobile tự thành bottom sheet trượt từ dưới lên.
 *
 * Hành vi:
 * - Controlled (`open` + `onOpenChange`) hoặc uncontrolled (`trigger` / `defaultOpen`).
 * - `confirm.onClick` trả Promise → tự loading, khoá Esc / bấm ngoài / nút X cho tới khi xong, xong thì tự đóng.
 * - `dismissible={false}` cho tác vụ không được ngắt giữa chừng.
 * - Focus trap, Esc, khoá cuộn trang, aria-labelledby / describedby do Base UI lo; thân dài tự cuộn (data-lenis-prevent).
 *
 * @example Xác nhận xoá (controlled, async)
 * <AppDialog
 *   open={open} onOpenChange={setOpen} tone="danger"
 *   title={t("deleteTitle")} description={t("deleteDesc")}
 *   confirm={{ label: t("delete"), onClick: () => deleteAddressApi(id) }}
 * />
 *
 * @example Form trong hộp thoại (uncontrolled + submit bằng form id)
 * <AppDialog trigger={<ActionButton>{t("add")}</ActionButton>} title={t("newAddress")} size="lg"
 *   confirm={{ label: t("save"), form: "address-form", loading: isSubmitting }}>
 *   <form id="address-form" onSubmit={handleSubmit(onSubmit)}>...</form>
 * </AppDialog>
 */
export function AppDialog({
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  trigger,
  title,
  description,
  eyebrow,
  tone = "default",
  icon,
  children,
  confirm,
  cancel,
  footer,
  size = "md",
  dismissible = true,
  showCloseButton,
  initialFocus,
  onClosed,
  className,
  bodyClassName,
}: AppDialogProps) {
  const t = useTranslations("Common.dialog");
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [pending, setPending] = useState(false);

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const busy = pending || Boolean(confirm?.loading);
  /* Đang xử lý thì coi như không cho đóng */
  const canDismiss = dismissible && !busy;
  const Icon = icon === undefined ? TONE_ICON[tone] : icon;
  const showClose = (showCloseButton ?? dismissible) && !busy;
  const cancelAction = cancel === false ? null : confirm || cancel ? (cancel ?? {}) : null;
  const hasFooter = Boolean(footer) || Boolean(confirm) || Boolean(cancelAction);

  const handleOpenChange = (next: boolean, details: DialogPrimitive.Root.ChangeEventDetails) => {
    /* Chặn đóng bằng Esc / bấm ra ngoài khi không cho phép (nút X đã ẩn trong trường hợp này) */
    if (!next && !canDismiss) {
      details.cancel();
      return;
    }
    setOpen(next);
  };

  const handleConfirm = async () => {
    if (!confirm?.onClick) return;
    setPending(true);
    try {
      const result = await confirm.onClick();
      if (result !== false) setOpen(false);
    } catch {
      /* Giữ hộp thoại mở — phía gọi tự báo lỗi (useNotify) trong onClick */
    } finally {
      setPending(false);
    }
  };

  const handleCancel = async () => {
    if (cancelAction && cancelAction.onClick) await cancelAction.onClick();
    setOpen(false);
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal={!canDismiss}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClosed?.();
      }}
    >
      {trigger ? <DialogPrimitive.Trigger render={trigger} /> : null}

      <DialogPrimitive.Portal>
        {/* Lớp phủ: đỏ đô rất sẫm + mờ nền → giữ tông ấm của thương hiệu thay vì đen xám */}
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-(--overlay)/45 backdrop-blur-[3px] transition-opacity duration-300",
            EASE,
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />

        <DialogPrimitive.Popup
          data-lenis-prevent
          initialFocus={initialFocus}
          className={cn(
            /* Khung chung */
            "fixed z-50 flex flex-col overflow-hidden bg-[var(--bg-card)] font-[family-name:var(--font-lora)] text-[var(--text-main)] outline-none",
            "shadow-[0_40px_90px_-30px_rgba(60,0,15,0.55)]",
            "transition-[opacity,translate,scale] duration-300",
            EASE,
            /* Mobile: bottom sheet trượt từ dưới lên */
            "inset-x-0 bottom-0 max-h-[92svh] data-starting-style:translate-y-full data-ending-style:translate-y-full",
            /* Desktop: giữa màn hình, hiện mờ + trồi nhẹ + phóng nhẹ */
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[calc(100svh-4rem)] sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:data-starting-style:translate-y-[calc(-50%+16px)] sm:data-starting-style:scale-[0.97] sm:data-starting-style:opacity-0",
            "sm:data-ending-style:translate-y-[calc(-50%+8px)] sm:data-ending-style:scale-[0.98] sm:data-ending-style:opacity-0 sm:data-ending-style:duration-200",
            SIZE_CLASS[size],
            className,
          )}
        >
          {/* Vạch đỏ đô mảnh ở đỉnh — dấu hiệu thương hiệu */}
          <span aria-hidden="true" className="h-[3px] shrink-0 bg-gradient-to-r from-[var(--primary-color)] via-[var(--primary-color)] to-[var(--accent-color)]" />
          {/* Tay nắm của bottom sheet (chỉ mobile) */}
          <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[var(--border)] sm:hidden" />

          {/* ---------- Header ---------- */}
          <header className={cn("flex shrink-0 gap-4 px-6 pb-4 pt-5 sm:px-8 sm:pt-7", showClose && "pr-14 sm:pr-16")}>
            {Icon ? (
              <span className="relative mt-0.5 grid size-11 shrink-0 place-items-center" style={{ color: TONE_COLOR[tone] }}>
                <span aria-hidden="true" className="absolute inset-1.5 rotate-45 border border-current opacity-40" />
                <Icon size={20} strokeWidth={1.6} className="relative" />
              </span>
            ) : null}
            <div className="min-w-0">
              {eyebrow ? (
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[2.5px] text-[var(--accent-color)]">{eyebrow}</p>
              ) : null}
              <DialogPrimitive.Title className="font-[family-name:var(--font-playfair)] text-[1.375rem] font-semibold leading-snug text-[var(--primary-ink)] sm:text-2xl">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-[var(--text-light)]">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
          </header>

          {showClose ? (
            <DialogPrimitive.Close
              aria-label={t("close")}
              className="absolute right-3 top-4 grid size-9 cursor-pointer place-items-center text-[var(--text-light)] transition-colors duration-300 hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-ink)] sm:right-4 sm:top-5"
            >
              <X size={18} strokeWidth={1.6} />
            </DialogPrimitive.Close>
          ) : null}

          {/* ---------- Thân: tự cuộn khi dài ---------- */}
          {children ? (
            <div
              data-lenis-prevent
              className={cn(
                "scrollbar-brand min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 text-sm leading-7 sm:px-8",
                size === "full" && "sm:flex-1",
                bodyClassName,
              )}
            >
              {children}
            </div>
          ) : null}

          {/* ---------- Footer ---------- */}
          {hasFooter ? (
            <footer className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-[var(--border)] bg-[var(--bg-main)] px-6 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-8">
              {footer ?? (
                <>
                  {cancelAction ? (
                    <ActionButton
                      type="button"
                      variant="cancel"
                      onClick={handleCancel}
                      disabled={busy || cancelAction.disabled}
                      icon={cancelAction.icon}
                      className="w-full sm:w-auto"
                    >
                      {cancelAction.label ?? t("cancel")}
                    </ActionButton>
                  ) : null}
                  {confirm ? (
                    <ActionButton
                      type={confirm.form ? "submit" : "button"}
                      form={confirm.form}
                      variant={tone === "danger" ? "custom" : "confirm"}
                      colors={tone === "danger" ? DANGER_COLORS : undefined}
                      onClick={confirm.form ? undefined : handleConfirm}
                      loading={busy}
                      disabled={confirm.disabled}
                      icon={confirm.icon}
                      className="w-full sm:w-auto sm:min-w-[140px]"
                    >
                      {confirm.label ?? t("confirm")}
                    </ActionButton>
                  ) : null}
                </>
              )}
            </footer>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
