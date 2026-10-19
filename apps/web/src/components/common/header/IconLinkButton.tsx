import { Link } from '@/i18n/routing';
import type { HeaderActionIcon } from './types';
import { CountBadge } from './CountBadge';

type IconLinkButtonProps = {
  href: string;
  label: string;
  icon: HeaderActionIcon;
  count?: number;
  /** Store đã nạp xong chưa — truyền cho CountBadge để không hiện "+N" khi vừa tải trang */
  countReady?: boolean;
};

/** Icon điều hướng ở header (VD Yêu thích) — không tooltip, nhãn đọc qua aria-label */
export function IconLinkButton({ href, label, icon: Icon, count, countReady }: IconLinkButtonProps) {
  return (
    <Link
      href={href}
      aria-label={count ? `${label} (${count})` : label}
      className="relative grid h-11 w-11 place-items-center text-primary-ink transition-opacity hover:opacity-75"
    >
      <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
      {count !== undefined ? <CountBadge count={count} ready={countReady} /> : null}
    </Link>
  );
}
