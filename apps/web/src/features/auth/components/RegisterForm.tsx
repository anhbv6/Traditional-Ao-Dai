'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function RegisterForm() {
  const t = useTranslations('Auth');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registering with:', { fullName, email, password, confirmPassword, agreeTerms });
  };

  const handleGoogleSignUp = () => {
    console.log('Signing up with Google');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
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
            {t('signupTitle')}
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="font-[family-name:var(--font-lora)] text-sm text-[var(--text-light)]"
          >
            {t('signupSubtitle')}
          </motion.p>
        </div>

        {/* Form */}
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block font-[family-name:var(--font-lora)] text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]"
              >
                {t('fullName')}
              </label>
              <Input
                id="name"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border-[var(--border)] focus:border-[var(--primary-color)]"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block font-[family-name:var(--font-lora)] text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]"
              >
                {t('password')}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 border-[var(--border)] focus:border-[var(--primary-color)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--text-main)] transition-colors focus:outline-none"
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block font-[family-name:var(--font-lora)] text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]"
              >
                {t('confirmPassword')}
              </label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border-[var(--border)] focus:border-[var(--primary-color)]"
              />
            </div>
          </div>

          {/* Agree to Terms */}
          <div className="flex items-start gap-2 pt-1 font-[family-name:var(--font-lora)] text-xs">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(!!checked)}
              className="mt-0.5"
            />
            <label
              htmlFor="terms"
              className="cursor-pointer text-[var(--text-light)] hover:text-[var(--text-main)] transition-colors select-none leading-relaxed font-medium"
            >
              {t('agreeTerms')}
            </label>
          </div>

          {/* Action Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-xs uppercase rounded-lg mt-2"
          >
            <span>{t('signin')}</span>
            <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
          </Button>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[var(--border)]"></div>
            <span className="flex-shrink mx-4 text-[var(--text-light)] text-[10px] font-bold uppercase tracking-widest">
              {t('orContinueWith')}
            </span>
            <div className="flex-grow border-t border-[var(--border)]"></div>
          </div>

          {/* Google Sign-Up Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            className="w-full h-12 bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 shadow-sm flex items-center justify-center gap-3 font-semibold tracking-wider text-xs uppercase rounded-lg transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.48-1.12 2.73-2.38 3.58v3h3.84c2.25-2.07 3.53-5.1 3.53-8.6c.01-.27-.03-.54-.05-.81Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-3c-1.07.72-2.45 1.16-4.09 1.16c-3.14 0-5.8-2.11-6.75-4.96H1.41v3.1c2 3.97 6.09 6.5 10.59 6.5Z"
              />
              <path
                fill="#FBBC05"
                d="M5.25 14.29c-.25-.72-.38-1.49-.38-2.29c0-.8.13-1.57.38-2.29V6.6H1.41C.51 8.38 0 10.38 0 12.5s.51 4.12 1.41 5.9l3.84-3.11Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.08 15.24 0 12 0C7.5 0 3.41 2.53 1.41 6.5l3.84 3.1c.95-2.85 3.61-4.85 6.75-4.85Z"
              />
            </svg>
            <span>{t('continueWithGoogle')}</span>
          </Button>
        </motion.form>

        {/* Footer Link */}
        <motion.p
          variants={itemVariants}
          className="text-center font-[family-name:var(--font-lora)] text-xs text-[var(--text-light)]"
        >
          {t('alreadyHaveAccount')}{' '}
          <Link
            href="/login"
            className="font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors underline decoration-[var(--primary-color)]/20 underline-offset-4"
          >
            {t('loginNow')}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
