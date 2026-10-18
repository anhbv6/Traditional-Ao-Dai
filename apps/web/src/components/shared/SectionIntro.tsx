import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionIntroProps {
  eyebrow: string;
  title: string;
  /** Đoạn mô tả ngắn dưới tiêu đề (tuỳ chọn) */
  description?: ReactNode;
  /** `default`: nền kem / be. `onDark`: khối nền đỏ thẫm, chữ trắng */
  tone?: "default" | "onDark";
  className?: string;
}

/**
 * Mở đầu một khối nội dung kiểu biên tập, căn trái: nhãn nhỏ + tiêu đề h2 Playfair (+ mô tả).
 * Dùng bên trong trang (Liên hệ...) — tiêu đề đầu trang dùng PageIntro, khối căn giữa trang chủ dùng SectionHeading.
 *
 * @example
 * <SectionIntro eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
 * <SectionIntro tone="onDark" eyebrow={t("eyebrow")} title={t("title")} />
 */
export function SectionIntro({ eyebrow, title, description, tone = "default", className }: SectionIntroProps) {
  const isDark = tone === "onDark";

  return (
    <div className={className}>
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[3px]",
          isDark ? "text-[var(--accent-on-primary)]" : "text-[var(--primary-ink)]",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-3 max-w-md font-[family-name:var(--font-playfair)] text-[1.75rem] font-semibold leading-tight sm:mt-4 sm:text-[2.125rem] 2xl:text-[2.375rem]",
          isDark ? "text-white" : "text-[var(--text-main)]",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn("mt-4 max-w-md text-[15px] leading-7 sm:mt-5", isDark ? "text-white/75" : "text-[var(--text-light)]")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
