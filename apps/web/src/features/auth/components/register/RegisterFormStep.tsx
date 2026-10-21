import React from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Mail, Smartphone, XCircle } from 'lucide-react';
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Link } from '@/i18n/routing';
import { TextField } from '@/components/shared/TextField';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { RegisterFormData } from '../../types/register.types';
import { AuthHeader } from '../AuthHeader';
import { AuthSubmitButton } from '../AuthSubmitButton';
import { LoginSocial } from '../login/LoginSocial';
import { AUTH_FIELD_PROPS, sanitizePhoneChange } from '../authField';

/** Kết quả kiểm tra email / SĐT đã tồn tại hay chưa */
function CheckStatus({ result }: { result: 'available' | 'taken' | null }) {
  if (result === 'available') return <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-600" />;
  if (result === 'taken') return <XCircle aria-hidden="true" className="size-4 text-rose-500" />;
  return null;
}

/** Nút icon nhỏ trong ô nhập (đổi Email ↔ SĐT, ẩn/hiện mật khẩu) */
function FieldIconButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-7 cursor-pointer place-items-center text-[var(--text-light)] transition-colors outline-none hover:text-[var(--primary-ink)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] [&_svg]:size-4"
    >
      {icon}
    </button>
  );
}

/** Thang độ mạnh mật khẩu 0–5 theo các quy tắc của schema đăng ký */
function getPasswordScore(password: string) {
  if (!password) return 0;
  const rules = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[@$!%*?&]/.test(password),
    !/\s/.test(password),
  ];
  const passed = rules.filter(Boolean).length;
  return Math.max(1, Math.min(Math.round((passed / rules.length) * 5), 5));
}

const STRENGTH_STYLES = [
  { key: 'passwordStrengthEmpty', bar: 'bg-[var(--border)]', text: 'text-[var(--text-light)]' },
  { key: 'passwordStrengthVeryWeak', bar: 'bg-rose-500', text: 'text-rose-500' },
  { key: 'passwordStrengthWeak', bar: 'bg-orange-400', text: 'text-orange-500' },
  { key: 'passwordStrengthMedium', bar: 'bg-yellow-400', text: 'text-yellow-600' },
  { key: 'passwordStrengthStrong', bar: 'bg-green-500', text: 'text-green-600' },
  { key: 'passwordStrengthVeryStrong', bar: 'bg-emerald-600', text: 'text-emerald-600' },
] as const;

export interface RegisterFormStepProps {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  register: UseFormRegister<RegisterFormData>;
  handleSubmit: UseFormHandleSubmit<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
  watch: UseFormWatch<RegisterFormData>;
  setValue: UseFormSetValue<RegisterFormData>;
  clearErrors: () => void;
  registerType: 'email' | 'phone';
  onFormSubmit: (data: RegisterFormData) => Promise<void>;
  /** Số lần bấm Đăng ký — để lỗi rung lại khi bấm lần nữa vẫn sai */
  submitCount: number;
  isRegistering: boolean;
  isCheckingEmail: boolean;
  isCheckingPhone: boolean;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  emailCheckResult: 'available' | 'taken' | null;
  phoneCheckResult: 'available' | 'taken' | null;
  loginWithGoogle: (credential: string) => void;
  itemVariants: Variants;
  setIsOtpStep: (val: boolean) => void;
  otpSentOnce: boolean;
}

export function RegisterFormStep({
  t,
  register,
  handleSubmit,
  errors,
  watch,
  setValue,
  clearErrors,
  registerType,
  onFormSubmit,
  submitCount,
  isRegistering,
  isCheckingEmail,
  isCheckingPhone,
  showPassword,
  setShowPassword,
  emailCheckResult,
  phoneCheckResult,
  loginWithGoogle,
  itemVariants,
  setIsOtpStep,
  otpSentOnce,
}: RegisterFormStepProps) {
  const passwordValue = watch('password') || '';
  const agreeTermsValue = watch('agreeTerms') || false;
  const strength = STRENGTH_STYLES[getPasswordScore(passwordValue)];
  const phoneField = register('phone');

  const switchRegisterType = (next: 'email' | 'phone') => {
    clearErrors();
    setValue('registerType', next);
    setValue('email', '');
    setValue('phone', '');
  };

  /* Lỗi hiển thị dưới ô theo luồng của TextField — rung lại mỗi lần bấm Đăng ký */
  const fieldErrorProps = (message?: string) => ({ error: message, shakeKey: submitCount });

  return (
    <>
      <AuthHeader title={t('signupTitle')} subtitle={t('signupSubtitle')} itemVariants={itemVariants} />

      <motion.form
        variants={itemVariants}
        onSubmit={handleSubmit(onFormSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-3">
          {/* Full Name */}
          <TextField
            {...AUTH_FIELD_PROPS}
            id="fullName"
            autoComplete="name"
            label={t('fullName')}
            placeholder={t('fullNamePlaceholder')}
            {...fieldErrorProps(errors.fullName?.message)}
            {...register('fullName')}
          />

          {/* Email / Phone — nút ở cuối ô để đổi cách đăng ký */}
          {registerType === 'email' ? (
            <TextField
              {...AUTH_FIELD_PROPS}
              id="email"
              type="email"
              autoComplete="email"
              label={t('emailAddress')}
              placeholder={t('emailPlaceholder')}
              loading={isCheckingEmail}
              suffix={
                <span className="flex items-center gap-1">
                  <CheckStatus result={isCheckingEmail ? null : emailCheckResult} />
                  <FieldIconButton icon={<Smartphone />} label={t('switchPhone')} onClick={() => switchRegisterType('phone')} />
                </span>
              }
              {...fieldErrorProps(errors.email?.message)}
              {...register('email')}
            />
          ) : (
            <TextField
              {...AUTH_FIELD_PROPS}
              id="phone"
              type="tel"
              autoComplete="tel"
              label={t('phone')}
              placeholder={t('phonePlaceholder')}
              loading={isCheckingPhone}
              suffix={
                <span className="flex items-center gap-1">
                  <CheckStatus result={isCheckingPhone ? null : phoneCheckResult} />
                  <FieldIconButton icon={<Mail />} label={t('switchEmail')} onClick={() => switchRegisterType('email')} />
                </span>
              }
              helperText={
                otpSentOnce ? (
                  <button
                    type="button"
                    onClick={() => setIsOtpStep(true)}
                    className="cursor-pointer font-semibold text-[var(--primary-ink)] underline underline-offset-4 transition-colors hover:text-[var(--accent-color)]"
                  >
                    {t('goToOtpStep')}
                  </button>
                ) : undefined
              }
              {...fieldErrorProps(errors.phone?.message)}
              {...phoneField}
              onChange={sanitizePhoneChange(phoneField.onChange)}
            />
          )}

          {/* Mật khẩu + xác nhận: 2 cột từ sm để form gọn trong một màn hình */}
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              {...AUTH_FIELD_PROPS}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              label={t('password')}
              placeholder={t('passwordPlaceholder')}
              suffix={
                <FieldIconButton
                  icon={showPassword ? <EyeOff /> : <Eye />}
                  label={showPassword ? t('hidePassword') : t('showPassword')}
                  onClick={() => setShowPassword(!showPassword)}
                />
              }
              {...fieldErrorProps(errors.password?.message)}
              {...register('password')}
            />
            <TextField
              {...AUTH_FIELD_PROPS}
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              label={t('confirmPassword')}
              placeholder={t('confirmPasswordPlaceholder')}
              {...fieldErrorProps(errors.confirmPassword?.message)}
              {...register('confirmPassword')}
            />
          </div>

          {/* Độ mạnh mật khẩu — một dòng gọn */}
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider select-none" aria-live="polite">
            <span className="shrink-0 text-[var(--text-light)]">{t('passwordStrengthLabel')}</span>
            <span className="flex h-1 flex-1 gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-full flex-1 transition-colors duration-300',
                    i <= getPasswordScore(passwordValue) ? strength.bar : 'bg-[var(--border)]'
                  )}
                />
              ))}
            </span>
            <span className={cn('shrink-0', strength.text)}>{t(strength.key)}</span>
          </div>
        </div>

        {/* Agree to Terms */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <Checkbox
              id="agreeTerms"
              checked={agreeTermsValue}
              aria-invalid={!!errors.agreeTerms || undefined}
              onCheckedChange={(checked) => setValue('agreeTerms', checked === true, { shouldValidate: true })}
            />
            <span className="flex flex-wrap items-center gap-x-1 leading-relaxed font-medium text-[var(--text-light)]">
              <label htmlFor="agreeTerms" className="cursor-pointer select-none transition-colors hover:text-[var(--text-main)]">
                {t('agreeTermsPrefix')}
              </label>
              {/* Mở tab mới để không mất dữ liệu đang nhập ở form đăng ký */}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener"
                className="font-semibold text-[var(--primary-ink)] underline decoration-[var(--primary-ink)]/30 underline-offset-4 transition-colors hover:text-[var(--accent-color)]"
              >
                {t('agreeTermsLink')}
              </Link>
            </span>
          </div>
          {errors.agreeTerms?.message && (
            <p
              key={`terms:${submitCount}`}
              role="alert"
              className="flex items-start gap-1.5 text-xs leading-5 text-rose-500 motion-safe:animate-shake"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>{errors.agreeTerms.message}</span>
            </p>
          )}
        </div>

        <AuthSubmitButton disabled={isCheckingEmail || isCheckingPhone} loading={isRegistering} icon={<ArrowRight />}>
          {registerType === 'phone' ? t('sendOtp') : t('signin')}
        </AuthSubmitButton>

        {/* Divider + Google Sign-Up */}
        <LoginSocial isLoading={isRegistering} loginWithGoogle={loginWithGoogle} t={t} />
      </motion.form>

      <motion.p variants={itemVariants} className="text-center text-xs text-[var(--text-light)]">
        {t('alreadyHaveAccount')}{' '}
        <Link
          href="/login"
          className="font-semibold text-[var(--primary-ink)] underline decoration-[var(--primary-ink)]/20 underline-offset-4 transition-colors hover:text-[var(--accent-color)]"
        >
          {t('loginNow')}
        </Link>
      </motion.p>
    </>
  );
}
