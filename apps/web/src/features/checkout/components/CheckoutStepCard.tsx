import React from "react";
import { cn } from "@/lib/utils";

interface CheckoutStepCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Hàng nút cuối khối: nút lùi bên trái, nút tiếp bên phải */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Khung một bước thanh toán — TĨNH (không tự chạy hiệu ứng khi xuất hiện), vì CheckoutExperience đã lo chuyển bước;
 * tránh chồng hai chuyển động như khi dùng StepPanel dùng chung.
 * Số bước đã nằm ở thanh tiến trình phía trên nên đầu khối chỉ còn tiêu đề + mô tả.
 */
export function CheckoutStepCard({ title, description, children, actions, className }: CheckoutStepCardProps) {
  return (
    <section className={cn("border border-[var(--border)] bg-[var(--bg-card)]", className)}>
      <header className="border-b border-[var(--border)] px-5 py-4 sm:px-7 sm:py-5">
        <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold leading-snug text-[var(--text-main)] sm:text-xl">
          {title}
        </h2>
        {description ? <p className="mt-1 text-[13px] leading-6 text-[var(--text-light)]">{description}</p> : null}
      </header>

      <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>

      {actions ? (
        <footer className="flex flex-col-reverse gap-3 border-t border-[var(--border)] bg-[var(--bg-main)]/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          {actions}
        </footer>
      ) : null}
    </section>
  );
}
export default CheckoutStepCard;
