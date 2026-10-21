'use client';

import { newPasswordSchema } from '@repo/shared/validation';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, KeyRound, ShieldAlert } from 'lucide-react';
import { ActionLink } from '@/components/shared/ActionLink';
import { TextField } from '@/components/shared/TextField';
import { notifyError, notifySuccess } from '@/lib/messages';
import { resetPasswordEmailApi, resetPasswordPhoneApi } from '../../api/forgot.api';

// Shared Components
import { AuthHeader } from '../AuthHeader';
import { AuthFormShell, authItemVariants } from '../AuthFormShell';
import { AuthSubmitButton } from '../AuthSubmitButton';
import { AuthBackAction } from '../AuthBackAction';
import { AUTH_FIELD_PROPS } from '../authField';

type ChangePasswordFormProps = {
  forgotType?: 'email' | 'phone';
  target?: string;
  resetToken?: string;
  onBack?: () => void;
};

/** Màn kết quả (thành công / hết phiên) — icon tròn + tiêu đề + mô tả + CTA */
function ResultPanel({
  icon,
  tone,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  tone: 'success' | 'warning';
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <AuthFormShell className="text-center">
      <motion.div variants={authItemVariants} className="flex justify-center">
        <div
          className={
            tone === 'success'
              ? 'rounded-full bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
              : 'rounded-full bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
          }
        >
          {icon}
        </div>
      </motion.div>
      <motion.div variants={authItemVariants} className="space-y-2">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--primary-ink)] sm:text-3xl">
          {title}
        </h2>
        <p className="font-[family-name:var(--font-lora)] text-[13px] leading-relaxed text-[var(--text-light)] sm:text-sm">
          {description}
        </p>
      </motion.div>
      <motion.div variants={authItemVariants}>{action}</motion.div>
    </AuthFormShell>
  );
}

export function ChangePasswordForm({ forgotType = 'email', target = '', resetToken = '', onBack }: ChangePasswordFormProps) {
  const t = useTranslations('Auth');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [submitCount, setSubmitCount] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isMismatch = !!confirmPassword && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setSubmitCount((count) => count + 1);
    if (!password || !confirmPassword) {
      setPasswordError(password ? '' : t('passwordRequired'));
      setConfirmError(confirmPassword ? '' : t('confirmPasswordRequired'));
      return;
    }
    if (isMismatch) return;

    // Cùng schema với backend (độ dài 6–72 ký tự)
    const parsed = newPasswordSchema.safeParse(password);
    if (!parsed.success) {
      setPasswordError(t(`responses.${parsed.error.issues[0]?.message ?? 'PASSWORD_MIN_LENGTH'}`));
      return;
    }

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

  const loginLink = (
    <ActionLink href="/login" variant="confirm" size="md" fullWidth icon={<ArrowRight />} iconPosition="end">
      {t('loginNow')}
    </ActionLink>
  );

  if (isSuccess) {
    return (
      <ResultPanel
        tone="success"
        icon={<CheckCircle2 size={40} className="stroke-[1.5]" />}
        title={t('success')}
        description={t('passwordUpdated')}
        action={loginLink}
      />
    );
  }

  // Vào thẳng trang mà chưa qua bước xác thực mã → không có resetToken, không thể đặt lại
  if (!resetToken) {
    return (
      <ResultPanel
        tone="warning"
        icon={<ShieldAlert size={40} className="stroke-[1.5]" />}
        title={t('changePasswordTitle')}
        description={t('forgotSessionExpired')}
        action={
          <ActionLink href="/forgot" variant="confirm" size="md" fullWidth icon={<ArrowRight />} iconPosition="end">
            {t('forgotTitle')}
          </ActionLink>
        }
      />
    );
  }

  const subtitle = t.rich('resetPasswordSubtitle', {
    target,
    b: (chunks) => <span className="font-semibold text-[var(--text-main)]">{chunks}</span>,
  });

  return (
    <AuthFormShell loading={isLoading}>
      <AuthHeader title={t('changePasswordTitle')} subtitle={subtitle} />

      {/* Form */}
      <motion.form variants={authItemVariants} onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-4">
          <TextField
            {...AUTH_FIELD_PROPS}
            id="password"
            type="password"
            passwordToggle
            autoComplete="new-password"
            label={t('newPassword')}
            placeholder={t('passwordPlaceholder')}
            value={password}
            disabled={isLoading}
            error={passwordError || undefined}
            shakeKey={submitCount}
            onValueChange={(value) => {
              setPassword(value);
              if (passwordError) setPasswordError('');
            }}
          />

          <TextField
            {...AUTH_FIELD_PROPS}
            id="confirmPassword"
            type="password"
            passwordToggle
            autoComplete="new-password"
            label={t('confirmNewPassword')}
            placeholder={t('confirmPasswordPlaceholder')}
            value={confirmPassword}
            disabled={isLoading}
            error={confirmError || (isMismatch ? t('passwordsDoNotMatch') : undefined)}
            shakeKey={submitCount}
            onValueChange={(value) => {
              setConfirmPassword(value);
              if (confirmError) setConfirmError('');
            }}
          />
        </div>

        <AuthSubmitButton loading={isLoading} icon={<KeyRound />}>
          {isLoading ? t('updating') : t('resetButton')}
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
export default ChangePasswordForm;
