'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { notifyError, notifySuccess } from '@/lib/messages';
import { forgotPasswordEmailApi, verifyResetPasswordEmailApi, verifyResetPasswordPhoneApi } from '../../api/forgot.api';
import { sendOtpApi } from '../../api/auth.api';

// Shared Components
import { AuthHeader } from '../AuthHeader';
import { AuthFormShell, authItemVariants } from '../AuthFormShell';
import { AuthSubmitButton } from '../AuthSubmitButton';
import { AuthBackAction } from '../AuthBackAction';
import { AuthResendRow } from '../AuthResendRow';
import { AuthOtpField } from '../AuthOtpField';

type VerifyOtpFormProps = {
  forgotType: 'email' | 'phone';
  target: string;
  /** Số giây còn lại trước khi được gửi lại mã (đếm ở ForgotForm) */
  resendSeconds: number;
  /** Gọi sau khi gửi lại mã thành công để bắt đầu lại thời gian chờ */
  onResent: () => void;
  onVerifySuccess: (resetToken: string) => void;
  onBack?: () => void;
};

export function VerifyOtpForm({
  forgotType,
  target,
  resendSeconds,
  onResent,
  onVerifySuccess,
  onBack,
}: VerifyOtpFormProps) {
  const t = useTranslations('Auth');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (otpError) setOtpError('');
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || isResending || isLoading) return;

    setIsResending(true);
    try {
      if (forgotType === 'email') {
        await forgotPasswordEmailApi(target);
      } else {
        await sendOtpApi(target, 'RESET_PASSWORD');
      }

      onResent();
      setOtp('');
      setOtpError('');
      notifySuccess(forgotType === 'email' ? t('forgotEmailCodeSent') : t('forgotPhoneOtpSent'));
    } catch (err: unknown) {
      console.error(err);
      notifyError(err, 'resendOtpError', t);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setSubmitCount((count) => count + 1);
    if (otp.length < 6) {
      setOtpError(t('otpRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const result = forgotType === 'email'
        ? await verifyResetPasswordEmailApi({ email: target, code: otp })
        : await verifyResetPasswordPhoneApi({ phone: target, code: otp });

      notifySuccess(t('otpVerifySuccess'));
      onVerifySuccess(result.data.resetToken);
    } catch (err: unknown) {
      console.error(err);
      setOtpError(notifyError(err, 'invalidOtp', t));
      setIsLoading(false);
    }
  };

  const subtitle = t.rich(forgotType === 'email' ? 'forgotEmailOtpSubtitle' : 'forgotPhoneOtpSubtitle', {
    target,
    b: (chunks) => <span className="font-semibold text-[var(--text-main)]">{chunks}</span>,
  });

  return (
    <AuthFormShell loading={isLoading}>
      <AuthHeader title={t('otpTitle')} subtitle={subtitle} />

      {/* Form */}
      <motion.form variants={authItemVariants} onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthOtpField value={otp} onChange={handleOtpChange} error={otpError || undefined} shakeKey={submitCount} disabled={isLoading} />

        <AuthResendRow
          seconds={resendSeconds}
          resending={isResending}
          disabled={isLoading}
          onResend={handleResend}
          t={t}
        />

        <AuthSubmitButton loading={isLoading} icon={<ShieldCheck />}>
          {isLoading ? t('verifying') : t('verifyButton')}
        </AuthSubmitButton>
      </motion.form>

      {onBack && (
        <motion.div variants={authItemVariants}>
          <AuthBackAction onClick={onBack} disabled={isLoading} label={t('back')} />
        </motion.div>
      )}
    </AuthFormShell>
  );
}
export default VerifyOtpForm;
