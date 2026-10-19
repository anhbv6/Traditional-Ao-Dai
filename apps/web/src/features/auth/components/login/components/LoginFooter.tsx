import React from 'react';
import { Link } from '@/i18n/routing';
import { motion } from 'motion/react';
import { authItemVariants } from '../../AuthFormShell';

interface LoginFooterProps {
  t: (key: string) => string;
}

export function LoginFooter({ t }: LoginFooterProps) {
  return (
    <div className="space-y-3 text-center font-[family-name:var(--font-lora)] text-xs">
      <motion.p variants={authItemVariants} className="text-[var(--text-light)]">
        {t('dontHaveAccount')}{' '}
        <Link
          href="/signin"
          className="font-semibold text-[var(--primary-ink)] underline decoration-[var(--primary-ink)]/20 underline-offset-4 transition-colors hover:text-[var(--accent-color)]"
        >
          {t('createAccount')}
        </Link>
      </motion.p>
      <motion.p variants={authItemVariants}>
        <Link
          href="/"
          className="font-medium text-[var(--text-light)] underline decoration-[var(--text-light)]/20 underline-offset-4 transition-colors hover:text-[var(--primary-ink)]"
        >
          {t('continueAsGuest')}
        </Link>
      </motion.p>
    </div>
  );
}
export default LoginFooter;
