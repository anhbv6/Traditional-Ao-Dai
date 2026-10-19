import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

const BACK_CLASS =
  'group/back inline-flex cursor-pointer items-center gap-1.5 font-[family-name:var(--font-lora)] text-xs font-semibold text-[var(--primary-ink)] transition-colors hover:text-[var(--accent-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50';

type AuthBackActionProps = {
  label: string;
  disabled?: boolean;
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

/** Liên kết / nút "Quay lại" ở cuối form auth — truyền `href` để chuyển trang, `onClick` để lùi bước */
export function AuthBackAction({ label, disabled, ...props }: AuthBackActionProps) {
  const content = (
    <>
      <ArrowLeft size={14} className="transition-transform group-hover/back:-translate-x-0.5" />
      <span>{label}</span>
    </>
  );

  return (
    <div className="text-center">
      {props.href ? (
        <Link href={props.href} className={BACK_CLASS}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={props.onClick} disabled={disabled} className={BACK_CLASS}>
          {content}
        </button>
      )}
    </div>
  );
}

export default AuthBackAction;
