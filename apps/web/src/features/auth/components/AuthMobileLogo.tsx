import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';

export function AuthMobileLogo() {
  return (
    <div className="flex justify-center lg:hidden">
      <Link href="/" className="flex flex-col items-center gap-1.5">
        <div className="relative h-9 w-9 overflow-hidden rounded-md flex items-center justify-center">
          <Image
            src="/logoPage.png"
            alt="AODAI logo"
            width={70}
            height={70}
            className="h-full w-full object-cover scale-125"
            unoptimized
          />
        </div>
        <span className="font-[family-name:var(--font-playfair)] text-base font-normal tracking-widest text-[var(--primary-color)] uppercase">
          AODAI
        </span>
      </Link>
    </div>
  );
}
export default AuthMobileLogo;
