import { Link } from '@/i18n/routing';
import Image from 'next/image';

type LogoProps = {
  textLogo?: boolean;
}

export function Logo({
  textLogo = false,
}: LogoProps) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 text-[26px] font-normal leading-none text-primary font-[family-name:var(--font-playfair)] tracking-widest uppercase"
      aria-label="AODAI home"
    >
      <div className="relative h-10 w-10 min-w-10 overflow-hidden rounded-md flex items-center justify-center">
        <Image
          src="/logoPage.png"
          alt="AODAI logo"
          width={80}
          height={80}
          className="h-full w-full object-cover scale-125"
          priority
        />
      </div>
      {textLogo && <span>AODAI</span>}
    </Link>
  );
}
