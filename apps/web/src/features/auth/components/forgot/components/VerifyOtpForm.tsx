'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { HttpError } from '@/lib/api-client';
import { forgotPasswordEmailApi, verifyResetPasswordEmailApi, verifyResetPasswordPhoneApi } from '../../../api/forgot.api';
import { sendOtpApi } from '../../../api/auth.api';

// Shared Components
import { AuthHeader } from '../../AuthHeader';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';

type VerifyOtpFormProps = {
  forgotType?: 'email' | 'phone';
  target?: string;
  onVerifySuccess: (resetToken: string) => void;
  onBack?: () => void;
};

export function VerifyOtpForm({
  forgotType = 'email',
  target = 'user@example.com',
  onVerifySuccess,
  onBack,
}: VerifyOtpFormProps) {
  const t = useTranslations('Auth');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const canResend = timer === 0 && !isLoading;

  useEffect(() => {
    if (timer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Focus first input box on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  const handleChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      if (pastedData[i]) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const getApiErrorMessage = (err: unknown, fallback: string) => {
    const payload = err instanceof HttpError ? err.payload : undefined;
    return payload && typeof payload === 'object' && 'message' in payload
      ? String(payload.message)
      : err instanceof Error
        ? err.message
        : fallback;
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      if (forgotType === 'email') {
        await forgotPasswordEmailApi(target);
      } else {
        await sendOtpApi(target, 'RESET_PASSWORD');
      }

      setTimer(60);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
      showToast.success(t('otpSent') || 'Mã mới đã được gửi đi!');
    } catch (err: unknown) {
      console.error(err);
      showToast.error(getApiErrorMessage(err, t('resendOtpError')));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) return;

    setIsLoading(true);
    try {
      const result = forgotType === 'email'
        ? await verifyResetPasswordEmailApi({ email: target, code: otpCode })
        : await verifyResetPasswordPhoneApi({ phone: target, code: otpCode });

      showToast.success(t('otpVerifySuccess'));
      onVerifySuccess(result.data.resetToken);
    } catch (err: unknown) {
      console.error(err);
      showToast.error(getApiErrorMessage(err, t('invalidOtp') || 'Mã xác thực không đúng hoặc đã hết hạn.'));
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

  const dynamicSubtitle =
    forgotType === 'email'
      ? t('forgotEmailOtpSubtitle', { target })
      : t('forgotPhoneOtpSubtitle', { target });

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
          title={t('otpTitle')}
          subtitle={dynamicSubtitle}
          itemVariants={itemVariants}
        />

        {/* Form */}
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-5">
          {/* OTP Code Inputs */}
          <div className="flex justify-between gap-1.5 sm:gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => {
                  if (el) inputRefs.current[idx] = el;
                }}
                onChange={(e) => handleChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className="w-[calc((100%-1.25rem)/6)] max-w-14 aspect-square sm:h-16 text-center text-lg sm:text-xl font-semibold rounded-lg border border-[var(--border)] bg-background text-[var(--text-main)] shadow-none outline-none transition-all focus:border-[var(--primary-color)] focus:bg-white focus:ring-2 focus:ring-[var(--ring)]/30"
              />
            ))}
          </div>

          {/* Resend Action */}
          <div className="flex items-center justify-between font-[family-name:var(--font-lora)] text-[11px] sm:text-xs">
            <span className="text-[var(--text-light)]">
              {timer > 0 ? t('resendTimer', { timer }) : t('noCodeReceived')}
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className={`font-semibold transition-colors cursor-pointer ${
                canResend
                  ? 'text-[var(--primary-color)] hover:text-[var(--accent-color)] underline underline-offset-4'
                  : 'text-[var(--text-light)]/50 cursor-not-allowed'
              }`}
            >
              {t('resendOtp')}
            </button>
          </div>

          {/* Action Button */}
          <Button
            type="submit"
            disabled={otp.join('').length < 6 || isLoading}
            className="w-full h-10 sm:h-11 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-[11px] sm:text-xs uppercase rounded-lg disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? t('verifying') : t('verifyButton')}
          </Button>
        </motion.form>

        {/* Back Button */}
        {onBack && (
          <motion.p
            variants={itemVariants}
            className="text-center font-[family-name:var(--font-lora)] text-[11px] sm:text-xs text-[var(--text-light)]"
          >
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors group/back cursor-pointer"
            >
              <ArrowLeft size={13} className="transition-transform group-hover/back:-translate-x-0.5" />
              <span>{t('back')}</span>
            </button>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
export default VerifyOtpForm;
