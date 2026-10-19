import React from 'react';
import { motion, type Variants } from 'motion/react';
import { AuthMobileLogo } from './AuthMobileLogo';
import { authItemVariants } from './AuthFormShell';

interface AuthHeaderProps {
  title: string;
  subtitle: React.ReactNode;
  itemVariants?: Variants;
}

export function AuthHeader({ title, subtitle, itemVariants = authItemVariants }: AuthHeaderProps) {
  return (
    <>
      {/* Mobile Logo */}
      <AuthMobileLogo />

      {/* Header Text */}
      <div className="space-y-2.5 text-center lg:text-left">
        <motion.h2
          variants={itemVariants}
          className="font-[family-name:var(--font-playfair)] text-[1.75rem] font-semibold leading-tight text-[var(--primary-ink)] sm:text-4xl"
        >
          {title}
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="font-[family-name:var(--font-lora)] text-[13px] leading-relaxed text-[var(--text-light)] sm:text-sm"
        >
          {subtitle}
        </motion.p>
      </div>
    </>
  );
}
export default AuthHeader;
