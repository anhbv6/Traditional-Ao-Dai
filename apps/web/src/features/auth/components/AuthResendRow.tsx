import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface AuthResendRowProps {
  /** Số giây còn lại trước khi được gửi lại (0 = đã gửi lại được) */
  seconds: number;
  resending?: boolean;
  disabled?: boolean;
  onResend: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

/** Dòng "Gửi lại mã sau Xs / Không nhận được mã? — Gửi lại mã OTP" bên dưới ô nhập OTP */
export function AuthResendRow({ seconds, resending = false, disabled = false, onResend, t }: AuthResendRowProps) {
  const canResend = seconds === 0 && !resending && !disabled;

  return (
    <div className="flex items-center justify-between gap-3 font-[family-name:var(--font-lora)] text-xs">
      <span className="text-[var(--text-light)]">
        {seconds > 0 ? t('resendTimer', { timer: seconds }) : t('noCodeReceived')}
      </span>
      <button
        type="button"
        onClick={onResend}
        disabled={!canResend}
        className={cn(
          'inline-flex items-center gap-1.5 font-semibold transition-colors',
          canResend
            ? 'cursor-pointer text-[var(--primary-ink)] underline underline-offset-4 hover:text-[var(--accent-color)]'
            : 'cursor-not-allowed text-[var(--text-light)]/50'
        )}
      >
        {resending && <Spinner className="size-3.5" aria-hidden="true" />}
        {t('resendOtp')}
      </button>
    </div>
  );
}

export default AuthResendRow;
