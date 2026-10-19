import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProfileSectionProps {
  /** Bỏ trống cả title / description / action → không có phần đầu khối */
  title?: ReactNode;
  description?: ReactNode;
  /** Nút / hành động ở góc phải tiêu đề */
  action?: ReactNode;
  children: ReactNode;
  /** Bỏ padding thân (danh sách tự kẻ dòng sát mép) */
  flush?: boolean;
  className?: string;
}

/**
 * Khối nội dung chuẩn của trang tài khoản: khung viền vuông nền thẻ,
 * đầu khối (tiêu đề Playfair + mô tả + hành động) ngăn với thân bằng vạch mảnh.
 */
export function ProfileSection({ title, description, action, children, flush = false, className }: ProfileSectionProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <section className={cn("border border-[var(--border)] bg-[var(--bg-card)]", className)}>
      {hasHeader ? (
        <header className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            {title ? <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[var(--text-main)]">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-[13px] leading-6 text-[var(--text-light)]">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={flush ? undefined : "p-5 sm:p-6"}>{children}</div>
    </section>
  );
}
