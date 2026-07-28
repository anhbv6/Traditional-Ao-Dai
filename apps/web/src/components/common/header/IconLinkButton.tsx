import { Link } from '@/i18n/routing';
import type { HeaderActionIcon } from './types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type IconLinkButtonProps = {
  href: string;
  label: string;
  icon: HeaderActionIcon;
  count?: number;
};

export function IconLinkButton({ href, label, icon: Icon, count }: IconLinkButtonProps) {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={href}
              aria-label={label}
              className="relative grid h-11 w-11 place-items-center text-[#800020] transition-opacity hover:opacity-75"
            />
          }
        >
          <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
          {count ? (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#800020] px-1 text-[10px] font-bold leading-none text-white">
              {count}
            </span>
          ) : null}
        </TooltipTrigger>
        <TooltipContent className="bg-[#800020] text-white border-0 shadow-md text-xs font-semibold px-2.5 py-1.5 rounded-md">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
