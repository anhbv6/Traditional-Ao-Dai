import React from 'react';
import { Key, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, type Variants } from 'motion/react';

interface LoginTabsProps {
  isOtpMode: boolean;
  setIsOtpMode: (val: boolean) => void;
  t: (key: string) => string;
  itemVariants: Variants;
}

export function LoginTabs({ isOtpMode, setIsOtpMode, t, itemVariants }: LoginTabsProps) {
  return (
    <motion.div variants={itemVariants} className="flex border-b border-[var(--border)] select-none">
      <button
        type="button"
        onClick={() => setIsOtpMode(false)}
        className={cn(
          "flex-1 pb-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-wider border-b-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5",
          !isOtpMode
            ? "border-[#800020] text-[#800020] font-bold"
            : "border-transparent text-[var(--text-light)] hover:text-[var(--text-main)]"
        )}
      >
        <Key size={12} className="sm:size-[13px]" />
        <span>{t('loginWithPassword')}</span>
      </button>
      <button
        type="button"
        onClick={() => setIsOtpMode(true)}
        className={cn(
          "flex-1 pb-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-wider border-b-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5",
          isOtpMode
            ? "border-[#800020] text-[#800020] font-bold"
            : "border-transparent text-[var(--text-light)] hover:text-[var(--text-main)]"
        )}
      >
        <Smartphone size={12} className="sm:size-[13px]" />
        <span>{t('loginWithOtp')}</span>
      </button>
    </motion.div>
  );
}
export default LoginTabs;
