'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { resetPasswordEmailApi, resetPasswordPhoneApi } from '../api/auth.api';
import { HttpError } from '@/lib/api-client';
import { showToast } from '@/components/ui/toast';

type ChangePasswordFormProps = {
  forgotType?: 'email' | 'phone';
  target?: string;
  resetToken?: string;
  onBack?: () => void;
};

export function ChangePasswordForm({ forgotType = 'email', target = '', resetToken = '', onBack }: ChangePasswordFormProps) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      showToast.error('Phiên xác thực đã hết hạn. Vui lòng xác thực lại mã.');
      return;
    }
    if (!password || password !== confirmPassword) return;

    setIsLoading(true);
    try {
      if (forgotType === 'email') {
        await resetPasswordEmailApi({ email: target, resetToken, password });
      } else {
        await resetPasswordPhoneApi({ phone: target, resetToken, password });
      }
      showToast.success('Đặt lại mật khẩu thành công!');
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      const payload = err instanceof HttpError ? err.payload : undefined;
      const apiMsg =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : err instanceof Error
            ? err.message
            : 'Đặt lại mật khẩu thất bại.';
      showToast.error(apiMsg);
    } finally {
      setIsLoading(false);
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

  if (isSuccess) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-4 py-8 sm:px-8 sm:py-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[460px] text-center space-y-6 rounded-2xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(42,37,37,0.02)]"
        >
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
              <CheckCircle2 size={48} className="stroke-[1.5]" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--primary-color)]">
              {t('success')}
            </h2>
            <p className="font-[family-name:var(--font-lora)] text-sm text-[var(--text-light)]">
              {t('passwordUpdated')}
            </p>
          </div>
          <Button
            onClick={() => router.push('/login')}
            className="w-full h-12 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-xs uppercase rounded-lg"
          >
            <span>{t('loginNow')}</span>
            <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    );
  }

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
            {t('changePasswordTitle')}
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="font-[family-name:var(--font-lora)] text-sm text-[var(--text-light)] leading-relaxed"
          >
            Mã xác thực cho <span className="font-semibold text-[var(--text-main)]">{target}</span> đã được xác nhận. Vui lòng nhập mật khẩu mới để đặt lại.
          </motion.p>
        </div>

        {/* Form */}
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block font-[family-name:var(--font-lora)] text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]"
              >
                {t('newPassword')}
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
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block font-[family-name:var(--font-lora)] text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]"
              >
                {t('confirmNewPassword')}
              </label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full border-[var(--border)] focus:border-[var(--primary-color)] ${
                  confirmPassword && password !== confirmPassword ? 'border-red-500 focus:ring-red-500/20' : ''
                }`}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="font-[family-name:var(--font-lora)] text-xs text-red-500 mt-1">
                  {t('passwordsDoNotMatch')}
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button
            type="submit"
            disabled={!resetToken || !password || password !== confirmPassword || isLoading}
            className="w-full h-12 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-xs uppercase rounded-lg disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? t('updating') : t('resetButton')}
          </Button>
        </motion.form>

        {/* Back Link */}
        {onBack && (
          <motion.p
            variants={itemVariants}
            className="text-center font-[family-name:var(--font-lora)] text-xs text-[var(--text-light)] pt-4"
          >
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors group/back cursor-pointer"
            >
              <ArrowLeft size={14} className="transition-transform group-hover/back:-translate-x-0.5" />
              <span>Quay lại</span>
            </button>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
