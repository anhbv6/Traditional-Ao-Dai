import { Link } from '@/i18n/routing';
import Image from 'next/image';

import { cn } from '@/lib/utils';

type LogoProps = {
  textLogo?: boolean;
  /** Class cho chữ AODAI (vd. ẩn trên màn rất hẹp) */
  textClassName?: string;
}

export function Logo({
  textLogo = false,
  textClassName,
}: LogoProps) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 text-[1.625rem] font-normal leading-none text-primary-ink font-[family-name:var(--font-playfair)] tracking-widest uppercase"
      aria-label="AODAI home"
    >
      <div className="relative h-10 w-10 min-w-10 overflow-hidden rounded-md flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="AODAI logo"
          width={80}
          height={80}
          className="h-full w-full object-contain"
          priority
        />
      </div>
      {textLogo && <span className={cn(textClassName)}>AODAI</span>}
    </Link>
  );
}
