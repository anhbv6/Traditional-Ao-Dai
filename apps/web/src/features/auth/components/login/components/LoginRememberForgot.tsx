import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from '@/i18n/routing';

interface LoginRememberForgotProps {
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  t: (key: string) => string;
}

export function LoginRememberForgot({
  rememberMe,
  setRememberMe,
  t,
}: LoginRememberForgotProps) {
  return (
    <div className="flex items-center justify-between font-[family-name:var(--font-lora)] text-[11px] sm:text-xs">
      <div className="flex items-center gap-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(!!checked)}
        />
        <label
          htmlFor="remember"
          className="cursor-pointer text-[var(--text-light)] hover:text-[var(--text-main)] transition-colors select-none font-medium"
        >
          {t('rememberMe')}
        </label>
      </div>
      <Link
        href="/forgot"
        className="font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors underline decoration-[var(--primary-color)]/20 underline-offset-4"
      >
        {t('forgotPassword')}
      </Link>
    </div>
  );
}
export default LoginRememberForgot;
