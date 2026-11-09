import { Link } from '@/i18n/routing';
import Image from 'next/image';

import { cn } from '@/lib/utils';

type LogoProps = {
  textLogo?: boolean;
  /** Class cho chữ thương hiệu (vd. ẩn trên màn rất hẹp) */
  textClassName?: string;
  /**
   * `responsive` (mặc định): nhỏ trên điện thoại, lớn dần theo màn hình (header, footer).
   * `sm`: luôn nhỏ — dùng trong drawer / chỗ hẹp.
   */
  size?: 'responsive' | 'sm';
  className?: string;
};

const SIZE_CLASS = {
  responsive: {
    link: 'gap-2 text-[1.0625rem] tracking-[0.16em] sm:gap-2.5 sm:text-[1.375rem] sm:tracking-widest lg:text-[1.625rem]',
    mark: 'size-8 min-w-8 sm:size-10 sm:min-w-10',
  },
  sm: {
    link: 'gap-2 text-[1.0625rem] tracking-[0.16em]',
    mark: 'size-8 min-w-8',
  },
} as const;

export function Logo({ textLogo = false, textClassName, size = 'responsive', className }: LogoProps) {
  const sizes = SIZE_CLASS[size];

  return (
    <Link
      href="/"
      className={cn(
        'flex items-center font-[family-name:var(--font-playfair)] font-normal uppercase leading-none text-primary-ink',
        sizes.link,
        className,
      )}
      aria-label="Thiên Canh home"
    >
      <span className={cn('relative flex items-center justify-center overflow-hidden rounded-md', sizes.mark)}>
        <Image src="/logo.png" alt="Thiên Canh logo" width={80} height={80} className="h-full w-full object-contain" priority />
      </span>
      {textLogo && <span className={cn('whitespace-nowrap', textClassName)}>Thiên Canh</span>}
    </Link>
  );
}
