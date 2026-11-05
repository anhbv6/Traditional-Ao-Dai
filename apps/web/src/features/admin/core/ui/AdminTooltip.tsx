"use client";

import { AppTooltip, type AppTooltipProps } from "@/components/shared/AppTooltip";
import { cn } from "@/lib/utils";

/*
 * Cùng giao diện popup của AdminInfoTip: nền đen #18181B, bo rounded-lg, chữ trắng 13px font Inter, không mũi tên.
 * `admin-shell` vì popup render qua portal (ra ngoài khung admin) — cần reset kiểu chữ storefront.
 */
const ADMIN_TOOLTIP_CLASS =
  "admin-shell rounded-lg bg-[#18181B] px-3 py-2 font-[family-name:var(--font-admin)] text-xs leading-relaxed text-white shadow-[0_10px_24px_-12px_rgba(9,9,11,0.5)]";

export type AdminTooltipProps = Omit<AppTooltipProps, "variant" | "size" | "showArrow">;

/**
 * Tooltip khu quản trị — nhãn ngắn khi rê chuột / focus bàn phím cho icon trạng thái, nút chỉ có icon, chữ bị cắt.
 * Bọc AppTooltip (định vị, tự lật sát mép, trễ mở, không bật trên màn cảm ứng) với giao diện admin.
 * Dùng thay thuộc tính `title` của trình duyệt. Hướng dẫn cạnh nhãn form vẫn dùng AdminInfoTip (mở được bằng chạm).
 *
 * @example
 * <AdminTooltip content={t("noChart")}>
 *   <span tabIndex={0} aria-label={t("noChart")}><CircleAlert size={14} aria-hidden /></span>
 * </AdminTooltip>
 */
export function AdminTooltip({ className, delay = 150, sideOffset = 6, maxWidth = 260, ...props }: AdminTooltipProps) {
  return (
    <AppTooltip
      {...props}
      delay={delay}
      sideOffset={sideOffset}
      maxWidth={maxWidth}
      showArrow={false}
      className={cn(ADMIN_TOOLTIP_CLASS, className)}
    />
  );
}
