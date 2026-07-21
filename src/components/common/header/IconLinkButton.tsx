import { Link } from '@/i18n/routing';
import type { HeaderActionIcon } from './types';

type IconLinkButtonProps = {
  href: string;
  label: string;
  icon: HeaderActionIcon;
  count?: number;
};

export function IconLinkButton({ href, label, icon: Icon, count }: IconLinkButtonProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative grid h-11 w-11 place-items-center text-[#800020] transition-opacity hover:opacity-75"
    >
      <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
      {count ? (
        <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#800020] px-1 text-[10px] font-bold leading-none text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
