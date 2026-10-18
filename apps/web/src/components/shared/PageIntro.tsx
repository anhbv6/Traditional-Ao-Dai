import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/utils";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  className?: string;
}

/**
 * Đầu trang kiểu biên tập dùng chung (Cửa hàng, Tin tức, Liên hệ...):
 * nhãn nhỏ + tiêu đề Playfair căn trái, mô tả đẩy sang phải trên màn hình lớn.
 */
export function PageIntro({ eyebrow, title, subtitle, className }: PageIntroProps) {
  return (
    <Reveal className={cn("grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16", className)}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[3.5px] text-[var(--primary-ink)]">{eyebrow}</p>
        <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-playfair)] text-[2rem] font-semibold leading-[1.1] text-[var(--text-main)] sm:mt-5 sm:text-[2.75rem] lg:text-[3rem] 2xl:text-[3.5rem]">
          {title}
        </h1>
      </div>
      <p className="max-w-lg text-[15px] leading-7 text-[var(--text-light)] sm:text-base sm:leading-8 lg:justify-self-end">
        {subtitle}
      </p>
    </Reveal>
  );
}
