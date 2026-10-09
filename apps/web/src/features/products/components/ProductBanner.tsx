import { Reveal } from "@/components/shared/Reveal";

interface ProductBannerProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

/**
 * Đầu trang Cửa hàng: tiêu đề căn trái kiểu biên tập, mô tả một bên — cùng ngôn ngữ với
 * trang Câu chuyện / Liên hệ. Gọn để sản phẩm xuất hiện sớm trong khung nhìn đầu tiên.
 */
export function ProductBanner({ eyebrow, title, subtitle }: ProductBannerProps) {
  return (
    <Reveal className="grid gap-5 pt-4 sm:pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[3.5px] text-[var(--primary-color)]">{eyebrow}</p>
        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-[34px] font-semibold leading-[1.1] text-[var(--text-main)] sm:text-[46px] xl:text-[52px]">
          {title}
        </h1>
      </div>
      <p className="max-w-lg text-[15px] leading-7 text-[var(--text-light)] lg:justify-self-end">{subtitle}</p>
    </Reveal>
  );
}
