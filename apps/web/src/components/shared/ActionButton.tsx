import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * Trạng thái của nút:
 * - `confirm`  : Đồng ý / Xác nhận — nền đỏ đô, chữ trắng.
 * - `dialog`   : Mở dialog / hành động phụ — viền đỏ đô mảnh, chữ đỏ đô.
 * - `cancel`   : Hủy bỏ — viền trung tính, chữ xám.
 * - `disabled` : Vô hiệu — không bấm được, không hiệu ứng.
 * - `custom`   : Khung trung tính, tự truyền màu qua prop `colors`.
 *
 * Mọi trạng thái (trừ disabled) dùng chung một hiệu ứng: rê chuột thì lớp màu đậm hơn một chút quét từ trái sang, rời chuột thì rút về.
 */
export type ActionButtonVariant = "confirm" | "dialog" | "cancel" | "disabled" | "custom";
export type ActionButtonSize = "sm" | "md" | "lg";

/**
 * Bộ màu của nút — nhận mọi giá trị màu CSS (`var(--accent-color)`, `#fff`, `rgb(...)`, `color-mix(...)`).
 * Truyền thiếu trường nào thì trường đó lấy theo `variant`.
 */
export interface ActionColors {
  /** Nền nút */
  bg?: string;
  /** Chữ + icon */
  text?: string;
  /** Viền */
  border?: string;
  /** Lớp quét khi rê chuột. Bỏ trống: tự làm đậm `bg` (pha 15% đen) */
  hover?: string;
}

export interface ActionButtonProps extends ComponentProps<"button"> {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  /** Ghi đè màu của `variant` */
  colors?: ActionColors;
  /** Icon lucide-react (kích thước tự chỉnh theo `size`) */
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  /** Đang xử lý: hiện spinner thay icon và khóa nút, vẫn giữ màu của trạng thái */
  loading?: boolean;
  /** Chiếm toàn bộ chiều ngang */
  fullWidth?: boolean;
}

/* ----------------------------------------------------------------------------
 * CẤU HÌNH MÀU — sửa màu nút toàn storefront tại đây
 * Dùng token trong globals.css nên tự đổi theo dark mode.
 * -------------------------------------------------------------------------- */

/** Pha đen để ra tông đậm hơn một chút — dùng cho lớp quét khi rê chuột */
const darken = (color: string, black = 15) => `color-mix(in oklab, ${color} ${100 - black}%, black)`;
/** Màu ở độ đậm `percent` (còn lại trong suốt) — dùng cho viền / nền phủ của nút viền */
const tint = (color: string, percent: number) => `color-mix(in oklab, ${color} ${percent}%, transparent)`;

const VARIANT_COLORS: Record<ActionButtonVariant, Required<ActionColors>> = {
  confirm: {
    bg: "var(--primary-color)",
    text: "#FFFFFF",
    border: "var(--primary-color)",
    hover: darken("var(--primary-color)"),
  },
  dialog: {
    bg: "transparent",
    text: "var(--primary-ink)",
    border: tint("var(--primary-ink)", 45),
    hover: tint("var(--primary-ink)", 14),
  },
  cancel: {
    bg: "transparent",
    text: "var(--text-light)",
    border: "var(--border)",
    hover: tint("var(--text-light)", 14),
  },
  disabled: {
    bg: "var(--bg-secondary)",
    text: tint("var(--text-light)", 60),
    border: "var(--border)",
    hover: "transparent",
  },
  custom: {
    bg: "transparent",
    text: "var(--text-main)",
    border: "var(--border)",
    hover: tint("var(--text-main)", 10),
  },
};

/**
 * Bộ màu dựng sẵn cho nút đặt trên khối nền đỏ đô (khối May đo, Newsletter / VIP Club...).
 * Dùng: <ActionButton variant="custom" colors={ON_PRIMARY_COLORS.solid}>
 */
export const ON_PRIMARY_COLORS = {
  /** Nút chính: nền sáng, chữ đỏ đô — hover phủ hồng đất */
  solid: {
    bg: "var(--bg-card)",
    text: "var(--primary-ink)",
    border: "var(--bg-card)",
    hover: "color-mix(in oklab, var(--accent-color) 22%, var(--bg-card))",
  },
  /** Nút phụ: viền trắng mờ, chữ trắng — hover phủ tối nhẹ */
  outline: {
    bg: "transparent",
    text: "#FFFFFF",
    border: "rgb(255 255 255 / 0.4)",
    hover: darken("transparent"),
  },
} satisfies Record<string, ActionColors>;

/* ----------------------------------------------------------------------------
 * KHUNG & HIỆU ỨNG
 * -------------------------------------------------------------------------- */

/* Nhịp hiệu ứng: 700ms, êm cả lúc vào và lúc ra (ease-in-out) */
const MOTION_CLASS = "duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]";

/* Khung chung: chữ in hoa giãn cách, vuông góc theo ngôn ngữ thiết kế storefront. Màu đọc từ biến --action-* */
const BASE_CLASS = cn(
  "group/action relative inline-flex cursor-pointer select-none items-center justify-center overflow-hidden border",
  "border-[var(--action-border)] bg-[var(--action-bg)] text-[var(--action-text)]",
  "font-[family-name:var(--font-lora)] font-semibold uppercase whitespace-nowrap outline-none",
  "transition-[color,background-color,border-color]",
  MOTION_CLASS,
  "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)]",
  "active:scale-[0.98]",
);

const SIZE_CLASS: Record<ActionButtonSize, string> = {
  sm: "min-h-9 gap-1.5 px-4 text-[10px] tracking-[1.5px] [&_svg]:size-3.5",
  md: "min-h-10 gap-2 px-6 text-[11px] tracking-[2px] [&_svg]:size-4",
  lg: "min-h-12 gap-2.5 px-8 text-xs tracking-[2px] [&_svg]:size-4",
};

const DISABLED_CLASS = "cursor-not-allowed active:scale-100";

/* Lớp màu đậm hơn quét từ trái sang khi rê chuột / focus bàn phím */
const SWEEP_CLASS = cn(
  "absolute inset-0 origin-left scale-x-0 bg-[var(--action-hover)] transition-transform",
  MOTION_CLASS,
  "group-hover/action:scale-x-100 group-focus-visible/action:scale-x-100",
);

/**
 * Nút hành động dùng chung của storefront. Bản link chuyển trang: `ActionLink`.
 *
 * @example
 * <ActionButton variant="confirm" loading={isPending} onClick={save}>{t("actions.save")}</ActionButton>
 * <ActionButton variant="dialog" icon={<Scissors />} onClick={openDialog}>{t("actions.customTailor")}</ActionButton>
 * <ActionButton variant="cancel" onClick={close}>{t("actions.cancel")}</ActionButton>
 * <ActionButton variant="custom" colors={{ bg: "var(--accent-color)", text: "#fff", border: "var(--accent-color)" }}>...</ActionButton>
 *
 * Làm nút mở của Base UI Dialog: <DialogTrigger render={<ActionButton variant="dialog" />}>...</DialogTrigger>
 */
export function ActionButton({
  variant = "confirm",
  size = "md",
  colors,
  icon,
  iconPosition = "start",
  loading = false,
  fullWidth = false,
  disabled,
  type = "button",
  className,
  style,
  children,
  ...props
}: ActionButtonProps) {
  const isDisabled = variant === "disabled" || Boolean(disabled);
  const action = getActionStyles({ variant, size, colors, fullWidth, disabled: isDisabled });

  return (
    <button
      type={type}
      disabled={isDisabled || loading}
      aria-busy={loading || undefined}
      aria-haspopup={variant === "dialog" ? "dialog" : undefined}
      data-variant={variant}
      className={cn(action.className, loading && "pointer-events-none", className)}
      style={{ ...action.style, ...style }}
      {...props}
    >
      <ActionContent sweep={action.sweep} icon={icon} iconPosition={iconPosition} loading={loading}>
        {children}
      </ActionContent>
    </button>
  );
}

/* ----------------------------------------------------------------------------
 * Phần dùng chung giữa ActionButton và ActionLink
 * -------------------------------------------------------------------------- */

type ActionCssVars = CSSProperties &
  Record<"--action-bg" | "--action-text" | "--action-border" | "--action-hover", string>;

export type ActionStyleOptions = Pick<ActionButtonProps, "variant" | "size" | "colors" | "fullWidth"> & {
  disabled?: boolean;
};

/** Gộp màu `variant` + `colors` thành biến CSS, kèm class khung và cờ có lớp quét hay không */
export function getActionStyles({
  variant = "confirm",
  size = "md",
  colors,
  fullWidth = false,
  disabled = false,
}: ActionStyleOptions): { className: string; style: ActionCssVars; sweep: boolean } {
  const isDisabled = variant === "disabled" || disabled;
  const preset = VARIANT_COLORS[isDisabled ? "disabled" : variant];
  const bg = colors?.bg ?? preset.bg;
  /* Đổi nền mà không truyền hover thì tự làm đậm nền mới, để hover luôn ăn khớp với màu nút */
  const hover = colors?.hover ?? (colors?.bg ? darken(colors.bg) : preset.hover);

  return {
    className: cn(BASE_CLASS, SIZE_CLASS[size], isDisabled && DISABLED_CLASS, fullWidth && "w-full"),
    style: {
      "--action-bg": bg,
      "--action-text": colors?.text ?? preset.text,
      "--action-border": colors?.border ?? preset.border,
      "--action-hover": hover,
    },
    sweep: !isDisabled,
  };
}

interface ActionContentProps {
  sweep?: boolean;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  loading?: boolean;
  children?: ReactNode;
}

/** Lớp quét + icon + nhãn bên trong nút */
export function ActionContent({ sweep = true, icon, iconPosition = "start", loading = false, children }: ActionContentProps) {
  const leadingIcon = loading ? <Spinner aria-hidden="true" /> : icon;

  return (
    <>
      {sweep ? <span aria-hidden="true" className={SWEEP_CLASS} /> : null}
      <span className="relative inline-flex items-center gap-[inherit]">
        {iconPosition === "start" || loading ? leadingIcon : null}
        {children}
        {iconPosition === "end" && !loading && icon ? (
          <span className={cn("inline-flex transition-transform group-hover/action:translate-x-0.5", MOTION_CLASS)}>
            {icon}
          </span>
        ) : null}
      </span>
    </>
  );
}
