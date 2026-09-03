'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { notifyError, notifySuccess } from '@/lib/messages';
import { resetPasswordEmailApi, resetPasswordPhoneApi } from '../../../api/forgot.api';

// Shared Components
import { AuthHeader } from '../../AuthHeader';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';

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
      showToast.error(t('forgotSessionExpired'));
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
      notifySuccess(t('resetPasswordSuccess'));
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      notifyError(err, 'resetPasswordError', t);
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
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-3.5 py-6 sm:px-8 sm:py-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[560px] text-center space-y-5 rounded-2xl p-5 sm:p-10"
        >
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
              <CheckCircle2 size={40} className="stroke-[1.5]" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--primary-color)]">
              {t('success')}
            </h2>
            <p className="font-[family-name:var(--font-lora)] text-xs sm:text-sm text-[var(--text-light)]">
              {t('passwordUpdated')}
            </p>
          </div>
          <Button
            onClick={() => router.push('/login')}
            className="w-full h-10 sm:h-11 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-[11px] sm:text-xs uppercase rounded-lg"
          >
            <span>{t('loginNow')}</span>
            <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    );
  }

  const dynamicSubtitle = t('resetPasswordSubtitle', { target });

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-3.5 py-6 sm:px-8 sm:py-12 lg:px-16 relative">
      <LoadingOverlay visible={isLoading} messageKey="updating" />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[560px] space-y-5 sm:space-y-8 rounded-2xl p-5 sm:p-10"
      >
        <AuthHeader
          title={t('changePasswordTitle')}
          subtitle={dynamicSubtitle}
          itemVariants={itemVariants}
        />

        {/* Form */}
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block font-[family-name:var(--font-lora)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]"
              >
                {t('newPassword')}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 border-[var(--border)] focus:border-[var(--primary-color)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--text-main)] transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block font-[family-name:var(--font-lora)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]"
              >
                {t('confirmNewPassword')}
              </label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t('confirmPasswordPlaceholder')}
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
            className="w-full h-10 sm:h-11 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-[11px] sm:text-xs uppercase rounded-lg disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? t('updating') : t('resetButton')}
          </Button>
        </motion.form>

        {/* Back Link */}
        {onBack && (
          <motion.p
            variants={itemVariants}
            className="text-center font-[family-name:var(--font-lora)] text-[11px] sm:text-xs text-[var(--text-light)] pt-3"
          >
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors group/back cursor-pointer"
            >
              <ArrowLeft size={13} className="transition-transform group-hover/back:-translate-x-0.5" />
              <span>Quay lại</span>
            </button>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
export default ChangePasswordForm;
