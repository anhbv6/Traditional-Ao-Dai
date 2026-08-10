'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowLeft, Send } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type ForgotFormProps = {
  onSubmitSuccess?: (email: string) => void;
};

export function ForgotForm({ onSubmitSuccess }: ForgotFormProps) {
  const t = useTranslations('Auth');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Requesting password reset for:', email);
    setSubmitted(true);
    if (onSubmitSuccess) {
      onSubmitSuccess(email);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] as const } },
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-4 py-8 sm:px-8 sm:py-12 lg:px-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[460px] space-y-6 sm:space-y-8 rounded-2xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(42,37,37,0.02)]"
      >
        {/* Mobile Logo */}
        <div className="flex justify-center lg:hidden">
          <Link href="/" className="flex flex-col items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-md flex items-center justify-center">
              <Image
                src="/logoPage.png"
                alt="AODAI logo"
                width={80}
                height={80}
                className="h-full w-full object-cover scale-125"
              />
            </div>
            <span className="font-[family-name:var(--font-playfair)] text-lg font-normal tracking-widest text-[var(--primary-color)] uppercase">
              AODAI
            </span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-3 text-center lg:text-left">
          <motion.h2
            variants={itemVariants}
            className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--primary-color)] sm:text-4xl"
          >
            {t('forgotTitle')}
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="font-[family-name:var(--font-lora)] text-sm text-[var(--text-light)] leading-relaxed"
          >
            {submitted ? t('resetLinkSent') : t('forgotSubtitle')}
          </motion.p>
        </div>

        {/* Form / Success State */}
        {!submitted ? (
          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block font-[family-name:var(--font-lora)] text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]"
              >
                {t('emailAddress')}
              </label>
              <Input
                id="email"
                type="email"
                required
                placeholder="example@aodai.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-[var(--border)] focus:border-[var(--primary-color)]"
              />
            </div>

            {/* Action Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-xs uppercase rounded-lg"
            >
              <span>{t('sendLink')}</span>
              <Send size={14} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Button>
          </motion.form>
        ) : (
          <motion.div variants={itemVariants} className="pt-2">
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="w-full h-12 border-[var(--border)] hover:bg-[var(--bg-secondary)] font-[family-name:var(--font-lora)] text-sm rounded-lg"
            >
              {t('resendEmail')}
            </Button>
          </motion.div>
        )}

        {/* Back to Login Link */}
        <motion.p
          variants={itemVariants}
          className="text-center font-[family-name:var(--font-lora)] text-xs text-[var(--text-light)]"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors group/back"
          >
            <ArrowLeft size={14} className="transition-transform group-hover/back:-translate-x-0.5" />
            <span>{t('backToLogin')}</span>
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
