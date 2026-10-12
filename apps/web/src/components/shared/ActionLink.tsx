import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ActionContent,
  getActionStyles,
  type ActionButtonSize,
  type ActionButtonVariant,
  type ActionColors,
} from "./ActionButton";

export interface ActionLinkProps extends ComponentProps<typeof Link> {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  /** Ghi đè màu của `variant` — xem `ActionColors` */
  colors?: ActionColors;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  fullWidth?: boolean;
}

/**
 * Link điều hướng mang giao diện ActionButton — dùng cho CTA chuyển trang (giữ đúng thẻ <a> cho SEO / mở tab mới).
 * Cùng `variant`, `size`, `colors`, `icon` với ActionButton; `variant="disabled"` chặn bấm bằng aria-disabled.
 *
 * @example
 * <ActionLink href="/products" variant="confirm" size="lg" icon={<ArrowRight />} iconPosition="end">{t("cta")}</ActionLink>
 */
export function ActionLink({
  variant = "confirm",
  size = "md",
  colors,
  icon,
  iconPosition = "start",
  fullWidth = false,
  className,
  style,
  children,
  ...props
}: ActionLinkProps) {
  const isDisabled = variant === "disabled";
  const action = getActionStyles({ variant, size, colors, fullWidth });

  return (
    <Link
      data-variant={variant}
      aria-disabled={isDisabled || undefined}
      tabIndex={isDisabled ? -1 : undefined}
      className={cn(action.className, isDisabled && "pointer-events-none", className)}
      style={{ ...action.style, ...style }}
      {...props}
    >
      <ActionContent sweep={action.sweep} icon={icon} iconPosition={iconPosition}>
        {children}
      </ActionContent>
    </Link>
  );
}
