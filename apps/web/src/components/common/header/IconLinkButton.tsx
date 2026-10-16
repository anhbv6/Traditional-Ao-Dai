import { Link } from '@/i18n/routing';
import type { HeaderActionIcon } from './types';
import { CountBadge } from './CountBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type IconLinkButtonProps = {
  href: string;
  label: string;
  icon: HeaderActionIcon;
  count?: number;
  /** Store đã nạp xong chưa — truyền cho CountBadge để không hiện "+N" khi vừa tải trang */
  countReady?: boolean;
};

export function IconLinkButton({ href, label, icon: Icon, count, countReady }: IconLinkButtonProps) {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={href}
              aria-label={count ? `${label} (${count})` : label}
              className="relative grid h-11 w-11 place-items-center text-primary-ink transition-opacity hover:opacity-75"
            />
          }
        >
          <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
          {count !== undefined ? <CountBadge count={count} ready={countReady} /> : null}
        </TooltipTrigger>
        <TooltipContent className="bg-primary text-white border-0 shadow-md text-xs font-semibold px-2.5 py-1.5 rounded-md">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
