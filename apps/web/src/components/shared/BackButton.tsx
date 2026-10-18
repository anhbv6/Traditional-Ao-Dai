"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  /** Trang dự phòng khi không có màn trước (mở link trực tiếp / tab mới) — mặc định trang chủ */
  fallbackHref?: string;
  /** Nhãn — mặc định "Quay lại" (namespace Common) */
  label?: string;
  className?: string;
}

/**
 * Nút quay về màn trước đó, đặt trên cùng các trang như Giỏ hàng / Yêu thích.
 * Có lịch sử trong tab thì `router.back()`; vào thẳng trang (lịch sử chỉ 1 mục) thì sang `fallbackHref`.
 *
 * @example
 * <BackButton fallbackHref="/products" />
 */
export function BackButton({ fallbackHref = "/", label, className }: BackButtonProps) {
  const t = useTranslations("Common");
  const router = useRouter();

  const handleClick = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group inline-flex min-h-9 cursor-pointer items-center gap-2 text-[10px] font-semibold uppercase tracking-[2px] text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] sm:text-[11px]",
        className
      )}
    >
      <span className="grid size-8 place-items-center border border-[var(--border)] transition-colors duration-300 group-hover:border-[var(--primary-color)] group-hover:bg-[var(--primary-color)] group-hover:text-white">
        <ArrowLeft size={14} strokeWidth={1.6} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
      </span>
      {label ?? t("back")}
    </button>
  );
}
