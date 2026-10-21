'use client';

import { emailSchema, vietnamPhoneSchema } from '@repo/shared/validation';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { KeyRound, Send } from 'lucide-react';
import { ActionButton } from '@/components/shared/ActionButton';
import { TextField } from '@/components/shared/TextField';
import { showToast } from '@/components/ui/toast';
import { notifyError } from '@/lib/messages';
import { forgotPasswordEmailApi } from '../../api/forgot.api';
import { sendOtpApi } from '../../api/auth.api';

// Shared Components
import { AuthHeader } from '../AuthHeader';
import { AuthFormShell, authItemVariants } from '../AuthFormShell';
import { AuthSubmitButton } from '../AuthSubmitButton';
import { AuthBackAction } from '../AuthBackAction';
import { AUTH_FIELD_PROPS } from '../authField';

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
  const [fieldError, setFieldError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setSubmitCount((count) => count + 1);
    const cleanVal = identifier.trim();

    if (!cleanVal) {
      setFieldError(t('forgotEnterError'));
      return;
    }

    const isEmail = cleanVal.includes('@');
    const isValid = isEmail
      ? emailSchema.safeParse(cleanVal).success
      : vietnamPhoneSchema.safeParse(cleanVal).success;

    if (!isValid) {
      setFieldError(isEmail ? t('invalidEmail') : t('invalidPhone'));
      return;
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

      onSubmitSuccess?.(cleanVal, isEmail ? 'email' : 'phone');
    } catch (err: unknown) {
      console.error(err);
      notifyError(err, 'DEFAULT_ERROR', t);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormShell loading={isLoading}>
      <AuthHeader title={t('forgotTitle')} subtitle={t('forgotSubtitle')} />

      {/* Input Form */}
      <motion.form variants={authItemVariants} onSubmit={handleSubmit} className="space-y-5" noValidate>
        <TextField
          {...AUTH_FIELD_PROPS}
          id="identifier"
          autoComplete="username"
          label={t('emailOrPhone')}
          placeholder={t('loginEmailOrPhonePlaceholder')}
          value={identifier}
          disabled={isLoading}
          error={fieldError || undefined}
          shakeKey={submitCount}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (fieldError) setFieldError('');
          }}
        />

        <AuthSubmitButton loading={isLoading} icon={<Send />}>
          {t('sendCode')}
        </AuthSubmitButton>
      </motion.form>

      {/* Đã gửi mã trước đó → cho vào thẳng bước nhập OTP, không cần gửi lại */}
      {defaultIdentifier && onGoToOtpStep && (
        <motion.div variants={authItemVariants}>
          <ActionButton variant="dialog" size="md" fullWidth disabled={isLoading} onClick={onGoToOtpStep} icon={<KeyRound />}>
            {t('goToOtpStep')}
          </ActionButton>
        </motion.div>
      )}

      <motion.div variants={authItemVariants}>
        <AuthBackAction href="/login" label={t('backToLogin')} />
      </motion.div>
    </AuthFormShell>
  );
}
export default EnterForgotForm;
