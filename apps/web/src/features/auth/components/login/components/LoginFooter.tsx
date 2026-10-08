import React from 'react';
import { Link } from '@/i18n/routing';
import { motion, type Variants } from 'motion/react';

interface LoginFooterProps {
  t: (key: string) => string;
  itemVariants: Variants;
}

export function LoginFooter({ t, itemVariants }: LoginFooterProps) {
  return (
    <div className="space-y-3 text-center">
      <motion.p
        variants={itemVariants}
        className="font-[family-name:var(--font-lora)] text-[11px] sm:text-xs text-[var(--text-light)]"
      >
        {t('dontHaveAccount')}{' '}
        <Link
          href="/signin"
          className="font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors underline decoration-[var(--primary-color)]/20 underline-offset-4"
        >
          {t('createAccount')}
        </Link>
      </motion.p>
      <motion.p
        variants={itemVariants}
        className="font-[family-name:var(--font-lora)] text-[11px] sm:text-xs"
      >
        <Link
          href="/"
          className="font-medium text-[var(--text-light)] hover:text-[var(--primary-color)] transition-colors underline underline-offset-4 decoration-[var(--text-light)]/20"
        >
          {t('continueAsGuest')}
        </Link>
      </motion.p>
    </div>
  );
}
export default LoginFooter;
