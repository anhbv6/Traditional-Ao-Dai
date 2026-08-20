'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { FormInput } from '@/components/shared/FormInput';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { HttpError } from '@/lib/api-client';
import { forgotPasswordEmailApi } from '../../../api/forgot.api';
import { sendOtpApi } from '../../../api/auth.api';

// Shared Components
import { AuthHeader } from '../../AuthHeader';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';

type EnterForgotFormProps = {
  defaultIdentifier?: string;
  onGoToOtpStep?: () => void;
  onSubmitSuccess?: (target: string, type: 'email' | 'phone') => void;
};

export function EnterForgotForm({
  defaultIdentifier = '',
  onGoToOtpStep,
  onSubmitSuccess,
}: EnterForgotFormProps) {
  const t = useTranslations('Auth');
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVal = identifier.trim();

    if (!cleanVal) {
      showToast.error(t('forgotEnterError'));
      return;
    }

    const isEmail = cleanVal.includes('@');
    const type = isEmail ? 'email' : 'phone';

    if (isEmail) {
      if (!cleanVal.includes('.') || cleanVal.length < 5) {
        showToast.error(t('invalidEmail') || 'Email không hợp lệ.');
        return;
      }
    } else {
      const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
      if (!phoneRegex.test(cleanVal)) {
        showToast.error(t('invalidPhone') || 'Số điện thoại không hợp lệ.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isEmail) {
        await forgotPasswordEmailApi(cleanVal);
        showToast.success(t('forgotEmailCodeSent'));
      } else {
        await sendOtpApi(cleanVal, 'RESET_PASSWORD');
        showToast.success(t('forgotPhoneOtpSent'));
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(cleanVal, type);
      }
    } catch (err: unknown) {
      console.error(err);
      const payload = err instanceof HttpError ? err.payload : undefined;
      const apiMsg =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : err instanceof Error
            ? err.message
            : 'Có lỗi xảy ra, vui lòng thử lại.';
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

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-3.5 py-6 sm:px-8 sm:py-12 lg:px-16 relative">
      <LoadingOverlay visible={isLoading} messageKey="verifying" />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[560px] space-y-5 sm:space-y-8 rounded-2xl p-5 sm:p-10"
      >
        <AuthHeader
          title={t('forgotTitle')}
          subtitle={t('forgotSubtitle')}
          itemVariants={itemVariants}
        />

        {/* Input Form */}
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-5">
          <FormInput
            id="identifier"
            type="text"
            required
            label={t('emailOrPhone')}
            placeholder={t('loginEmailOrPhonePlaceholder')}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          {/* Action Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 sm:h-11 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-[11px] sm:text-xs uppercase rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <span>Gửi mã xác nhận</span>
                <Send size={13} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </>
            )}
          </Button>
        </motion.form>

        {defaultIdentifier && onGoToOtpStep && (
          <motion.p
            variants={itemVariants}
            className="text-center font-[family-name:var(--font-lora)] text-[11px] sm:text-xs"
          >
            <button
              type="button"
              onClick={onGoToOtpStep}
              className="font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors underline decoration-[var(--primary-color)]/20 underline-offset-4 cursor-pointer"
            >
              {t('goToOtpStep')}
            </button>
          </motion.p>
        )}

        {/* Back to Login Link */}
        <motion.p
          variants={itemVariants}
          className="text-center font-[family-name:var(--font-lora)] text-[11px] sm:text-xs text-[var(--text-light)]"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors group/back"
          >
            <ArrowLeft size={13} className="transition-transform group-hover/back:-translate-x-0.5" />
            <span>{t('backToLogin')}</span>
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
export default EnterForgotForm;
