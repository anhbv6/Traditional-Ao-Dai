import React from 'react';
import { Key, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { authItemVariants } from '../AuthFormShell';

interface LoginTabsProps {
  isOtpMode: boolean;
  setIsOtpMode: (val: boolean) => void;
  disabled?: boolean;
  t: (key: string) => string;
}

const TABS = [
  { otp: false, icon: Key, labelKey: 'loginWithPassword' },
  { otp: true, icon: Smartphone, labelKey: 'loginWithOtp' },
] as const;

export function LoginTabs({ isOtpMode, setIsOtpMode, disabled = false, t }: LoginTabsProps) {
  return (
    <motion.div
      variants={authItemVariants}
      role="tablist"
      className="flex select-none border-b border-[var(--border)]"
    >
      {TABS.map(({ otp, icon: Icon, labelKey }) => {
        const active = isOtpMode === otp;
        return (
          <button
            key={labelKey}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => setIsOtpMode(otp)}
            className={cn(
              '-mb-px flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-b-2 pb-3 text-center font-[family-name:var(--font-lora)] text-[11px] font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed sm:text-xs',
              active
                ? 'border-[var(--primary-color)] text-[var(--primary-ink)]'
                : 'border-transparent text-[var(--text-light)] hover:text-[var(--text-main)]'
            )}
          >
            <Icon size={13} />
            <span>{t(labelKey)}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
export default LoginTabs;
