import React from 'react';
import { motion, type Variants } from 'motion/react';
import { AuthMobileLogo } from './AuthMobileLogo';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  itemVariants?: Variants;
}

export function AuthHeader({ title, subtitle, itemVariants }: AuthHeaderProps) {
  return (
    <>
      {/* Mobile Logo */}
      <AuthMobileLogo />

      {/* Header Text */}
      <div className="space-y-2 text-center lg:text-left">
        <motion.h2
          variants={itemVariants}
          className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--primary-color)] sm:text-4xl"
        >
          {title}
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="font-[family-name:var(--font-lora)] text-xs sm:text-sm text-[var(--text-light)]"
        >
          {subtitle}
        </motion.p>
      </div>
    </>
  );
}
export default AuthHeader;
