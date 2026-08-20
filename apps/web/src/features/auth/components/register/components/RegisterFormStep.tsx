import React from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Smartphone, Mail, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { FormInput } from '@/components/shared/FormInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { showToast } from '@/components/ui/toast';
import { InlineValidationTooltip } from './InlineValidationTooltip';
import { TooltipChecklist } from './TooltipChecklist';
import type { UseFormHandleSubmit, UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import type { RegisterFormData } from '../../../types/register.types';
import { cn } from '@/lib/utils';
import { GoogleAuthButton } from '../../GoogleAuthButton';

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
  handleInvalidSubmit: (errors: FieldErrors<RegisterFormData>) => void;
  isRegistering: boolean;
  isCheckingEmail: boolean;
  isCheckingPhone: boolean;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  emailCheckResult: 'available' | 'taken' | null;
  emailApiError: string;
  phoneCheckResult: 'available' | 'taken' | null;
  phoneApiError: string;
  validationTooltipSignal: number;
  validationTooltipTarget: string | undefined;
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
  handleInvalidSubmit,
  isRegistering,
  isCheckingEmail,
  isCheckingPhone,
  showPassword,
  setShowPassword,
  emailCheckResult,
  emailApiError,
  phoneCheckResult,
  phoneApiError,
  validationTooltipSignal,
  validationTooltipTarget,
  loginWithGoogle,
  itemVariants,
  setIsOtpStep,
  otpSentOnce,
}: RegisterFormStepProps) {
  // Watch values for real-time validation checks
  const fullNameValue = watch('fullName') || '';
  const emailValue = watch('email') || '';
  const phoneValue = watch('phone') || '';
  const passwordValue = watch('password') || '';
  const confirmPasswordValue = watch('confirmPassword') || '';

  // Full Name validations
  const fnRequired = fullNameValue.trim().length > 0;
  const fnLength = fullNameValue.trim().length >= 2 && fullNameValue.trim().length <= 50;
  const hasFullNameError = (fullNameValue.length > 0 && (!fnRequired || !fnLength)) || !!errors.fullName;
  const isFullNameSuccess = fnRequired && fnLength;

  // Email validations
  const emailRequired = emailValue.trim().length > 0;
  const emailFormat = emailRequired && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  const hasEmailError = (emailValue.length > 0 && (!emailRequired || !emailFormat)) || !!errors.email || emailCheckResult === 'taken';
  const isEmailSuccess = emailRequired && emailFormat && emailCheckResult === 'available';
  const emailErrorMessage = errors.email?.message || (emailCheckResult === 'taken' ? (emailApiError || t('emailTaken')) : undefined);

  // Phone validations
  const phoneRequired = phoneValue.trim().length > 0;
  const phoneDigits = phoneValue.length === 10 && /^\d+$/.test(phoneValue);
  const phonePrefix = phoneValue.length >= 2 && /^0[35789]/.test(phoneValue);
  const phoneAllValid = phoneRequired && phoneDigits && phonePrefix;
  const hasPhoneError = (phoneValue.length > 0 && !phoneAllValid) || !!errors.phone || phoneCheckResult === 'taken';
  const isPhoneSuccess = phoneAllValid && phoneCheckResult === 'available';
  const phoneErrorMessage = errors.phone?.message || (phoneCheckResult === 'taken' ? (phoneApiError || t('phoneTaken')) : undefined);

  // Password validations
  const pwRequired = passwordValue.length > 0;
  const pwLength = passwordValue.length >= 8;
  const pwUpper = /[A-Z]/.test(passwordValue);
  const pwLower = /[a-z]/.test(passwordValue);
  const pwDigit = /\d/.test(passwordValue);
  const pwSpecial = /[@$!%*?&]/.test(passwordValue);
  const pwNoSpace = passwordValue.length > 0 && !/\s/.test(passwordValue);
  const pwAllValid = pwRequired && pwLength && pwUpper && pwLower && pwDigit && pwSpecial && pwNoSpace;
  const hasPasswordError = (passwordValue.length > 0 && !pwAllValid) || !!errors.password;
  const isPasswordSuccess = pwAllValid;

  // Confirm Password validations
  const cpRequired = confirmPasswordValue.length > 0;
  const cpMatch = confirmPasswordValue.length > 0 && confirmPasswordValue === passwordValue;
  const cpAllValid = cpRequired && cpMatch;
  const hasConfirmPasswordError = (confirmPasswordValue.length > 0 && !cpAllValid) || !!errors.confirmPassword;
  const isConfirmPasswordSuccess = cpAllValid;

  // Password Strength calculations
  let pwScore = 0;
  if (pwLength) pwScore++;
  if (pwUpper) pwScore++;
  if (pwLower) pwScore++;
  if (pwDigit) pwScore++;
  if (pwSpecial) pwScore++;
  if (pwNoSpace && passwordValue.length > 0) pwScore++;

  const pwFinalScore = passwordValue.length === 0 ? 0 : Math.max(1, Math.min(Math.round((pwScore / 6) * 5), 5));

  const getStrengthDetails = () => {
    if (!passwordValue) return { score: 0, label: t('passwordStrengthEmpty'), color: 'bg-zinc-200', textClass: 'text-zinc-400' };
    switch (pwFinalScore) {
      case 1:
        return { score: 1, label: t('passwordStrengthVeryWeak'), color: 'bg-rose-500', textClass: 'text-rose-500' };
      case 2:
        return { score: 2, label: t('passwordStrengthWeak'), color: 'bg-orange-400', textClass: 'text-orange-400' };
      case 3:
        return { score: 3, label: t('passwordStrengthMedium'), color: 'bg-yellow-400', textClass: 'text-yellow-400' };
      case 4:
        return { score: 4, label: t('passwordStrengthStrong'), color: 'bg-green-400', textClass: 'text-green-400' };
      case 5:
        return { score: 5, label: t('passwordStrengthVeryStrong'), color: 'bg-emerald-600', textClass: 'text-emerald-600' };
      default:
        return { score: 0, label: t('passwordStrengthEmpty'), color: 'bg-zinc-200', textClass: 'text-zinc-400' };
    }
  };
  const strength = getStrengthDetails();

  // Tooltips
  const fullNameTooltip = (
    <TooltipChecklist
      items={[
        { label: t('fullNameRuleRequired'), isValid: fnRequired },
        { label: t('fullNameRuleLength'), isValid: fnLength },
      ]}
    />
  );

  const emailTooltip = (
    <TooltipChecklist
      items={[
        { label: t('emailRuleRequired'), isValid: emailRequired },
        { label: t('emailRuleFormat'), isValid: emailFormat },
        ...(emailCheckResult === 'taken' ? [{ label: emailApiError || t('emailTaken'), isValid: false }] : []),
      ]}
    />
  );

  const phoneTooltip = (
    <TooltipChecklist
      items={[
        { label: t('phoneRuleRequired'), isValid: phoneRequired },
        { label: t('phoneRuleDigits'), isValid: phoneDigits },
        { label: t('phoneRulePrefix'), isValid: phonePrefix },
        ...(phoneCheckResult === 'taken' ? [{ label: phoneApiError || t('phoneTaken'), isValid: false }] : []),
      ]}
    />
  );

  const passwordTooltip = (
    <TooltipChecklist
      items={[
        { label: t('passwordRuleRequired'), isValid: pwRequired },
        { label: t('passwordRuleLength'), isValid: pwLength },
        { label: t('passwordRuleUpper'), isValid: pwUpper },
        { label: t('passwordRuleLower'), isValid: pwLower },
        { label: t('passwordRuleDigit'), isValid: pwDigit },
        { label: t('passwordRuleSpecial'), isValid: pwSpecial },
        { label: t('passwordRuleNoSpace'), isValid: pwNoSpace },
      ]}
    />
  );

  const confirmPasswordTooltip = (
    <TooltipChecklist
      items={[
        { label: t('confirmPasswordRuleRequired'), isValid: cpRequired },
        { label: t('confirmPasswordRuleMatch'), isValid: cpMatch },
      ]}
    />
  );

  return (
    <>
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <motion.h2
          variants={itemVariants}
          className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--primary-color)] sm:text-4xl"
        >
          {t('signupTitle')}
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="font-[family-name:var(--font-lora)] text-xs sm:text-sm text-[var(--text-light)]"
        >
          {t('signupSubtitle')}
        </motion.p>
      </div>

      {/* Form */}
      <motion.form
        variants={itemVariants}
        onSubmit={handleSubmit(onFormSubmit, handleInvalidSubmit)}
        className="space-y-5"
        noValidate
      >
        <div className="space-y-4">
          {/* Full Name */}
          <FormInput
            id="fullName"
            type="text"
            label={t('fullName')}
            tooltip={fullNameTooltip}
            placeholder={t('fullNamePlaceholder')}
            isInvalid={hasFullNameError}
            error={errors.fullName?.message}
            isSuccess={isFullNameSuccess}
            validationTooltipSignal={validationTooltipSignal}
            validationTooltipTarget={validationTooltipTarget}
            tooltipPriority={50}
            {...register('fullName')}
          />

          {/* Email / Phone Field with Switch Toggle */}
          {registerType === 'email' ? (
            <FormInput
              id="email"
              type="text"
              label={t('emailAddress')}
              tooltip={emailTooltip}
              placeholder={t('emailPlaceholder')}
              isInvalid={hasEmailError}
              error={emailErrorMessage}
              isSuccess={isEmailSuccess}
              validationTooltipSignal={validationTooltipSignal}
              validationTooltipTarget={validationTooltipTarget}
              tooltipPriority={40}
              rightElement={
                <div className="flex items-center gap-1.5">
                  {isCheckingEmail && (
                    <RefreshCw size={14} className="text-[#800020] animate-spin" />
                  )}
                  {!isCheckingEmail && emailCheckResult === 'available' && (
                    <CheckCircle2 size={15} className="text-green-600" />
                  )}
                  {!isCheckingEmail && emailCheckResult === 'taken' && (
                    <XCircle size={15} className="text-red-500" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      clearErrors();
                      setValue('registerType', 'phone');
                      setValue('email', '');
                      setValue('phone', '');
                    }}
                    className="text-[var(--text-light)] hover:text-[var(--primary-color)] transition-colors cursor-pointer select-none outline-none p-1 flex items-center justify-center"
                    title={t('switchPhone')}
                  >
                    <Smartphone size={16} />
                  </button>
                </div>
              }
              {...register('email')}
            />
          ) : (
            <div className="space-y-2">
              <FormInput
                id="phone"
                type="tel"
                label={t('phone')}
                tooltip={phoneTooltip}
                labelAction={
                  otpSentOnce ? (
                    <button
                      type="button"
                      onClick={() => setIsOtpStep(true)}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors select-none outline-none cursor-pointer"
                    >
                      <span>{t('goToOtpStep')}</span>
                    </button>
                  ) : undefined
                }
                placeholder={t('phonePlaceholder')}
                isInvalid={hasPhoneError}
                error={phoneErrorMessage}
                isSuccess={isPhoneSuccess}
                validationTooltipSignal={validationTooltipSignal}
                validationTooltipTarget={validationTooltipTarget}
                tooltipPriority={40}
                rightElement={
                  <div className="flex items-center gap-1.5">
                    {isCheckingPhone && (
                      <RefreshCw size={14} className="text-[#800020] animate-spin" />
                    )}
                    {!isCheckingPhone && phoneCheckResult === 'available' && (
                      <CheckCircle2 size={15} className="text-green-600" />
                    )}
                    {!isCheckingPhone && phoneCheckResult === 'taken' && (
                      <XCircle size={15} className="text-red-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        clearErrors();
                        setValue('registerType', 'email');
                        setValue('email', '');
                        setValue('phone', '');
                      }}
                      className="text-[var(--text-light)] hover:text-[var(--primary-color)] transition-colors cursor-pointer select-none outline-none p-1 flex items-center justify-center"
                      title={t('switchEmail')}
                    >
                      <Mail size={16} />
                    </button>
                  </div>
                }
                {...register('phone')}
              />
            </div>
          )}

          {/* Password Field */}
          <FormInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            label={t('password')}
            tooltip={passwordTooltip}
            placeholder={t('passwordPlaceholder')}
            isInvalid={hasPasswordError}
            error={errors.password?.message}
            isSuccess={isPasswordSuccess}
            validationTooltipSignal={validationTooltipSignal}
            validationTooltipTarget={validationTooltipTarget}
            tooltipPriority={30}
            passwordToggle={false}
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[var(--text-light)] hover:text-[var(--text-main)] transition-colors focus:outline-none cursor-pointer flex items-center"
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            helperText={
              <div className="space-y-1.5 pt-1.5 font-[family-name:var(--font-lora)] select-none">
                <div className="flex items-center justify-between gap-3 text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-[var(--text-light)]">{t('passwordStrengthLabel')}</span>
                  <span className={strength.textClass}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-200/50 rounded-full overflow-hidden flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-full flex-grow rounded-full transition-all duration-300",
                        i <= strength.score ? strength.color : "bg-zinc-200/40"
                      )}
                    />
                  ))}
                </div>
              </div>
            }
            alwaysShowHelperText
            {...register('password')}
          />

          {/* Confirm Password */}
          <FormInput
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            label={t('confirmPassword')}
            tooltip={confirmPasswordTooltip}
            placeholder={t('passwordPlaceholder')}
            isInvalid={hasConfirmPasswordError}
            error={errors.confirmPassword?.message}
            isSuccess={isConfirmPasswordSuccess}
            validationTooltipSignal={validationTooltipSignal}
            validationTooltipTarget={validationTooltipTarget}
            tooltipPriority={20}
            passwordToggle={false}
            {...register('confirmPassword')}
          />
        </div>

        {/* Agree to Terms */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex gap-2 font-[family-name:var(--font-lora)] text-xs items-center">
            <Checkbox
              id="agreeTerms"
              checked={watch('agreeTerms')}
              onCheckedChange={(checked) => setValue('agreeTerms', checked === true, { shouldValidate: true })}
              className="mt-0.5"
            />
            <label
              htmlFor="agreeTerms"
              className="cursor-pointer text-[var(--text-light)] hover:text-[var(--text-main)] transition-colors select-none leading-relaxed font-medium flex items-center gap-1"
            >
              <span>{t('agreeTerms')}</span>
              <InlineValidationTooltip
                id="agreeTerms"
                content={
                  <div className="font-[family-name:var(--font-lora)] text-[11px] font-semibold leading-relaxed text-zinc-100">
                    {errors.agreeTerms ? errors.agreeTerms.message : t('agreeTermsTip')}
                  </div>
                }
                isInvalid={!!errors.agreeTerms}
                validationTooltipSignal={validationTooltipSignal}
                validationTooltipTarget={validationTooltipTarget}
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          data-tooltip-submit="true"
          disabled={isRegistering || isCheckingEmail || isCheckingPhone}
          className="w-full h-10 sm:h-11 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-[11px] sm:text-xs uppercase rounded-lg mt-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          {isRegistering ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <>
              <span>{t('signin')}</span>
              <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-1" />
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative flex py-1.5 sm:py-2.5 items-center">
          <div className="flex-grow border-t border-[var(--border)]"></div>
          <span className="flex-shrink mx-4 text-[var(--text-light)] text-[10px] font-bold uppercase tracking-widest">
            {t('orContinueWith')}
          </span>
          <div className="flex-grow border-t border-[var(--border)]"></div>
        </div>

        {/* Google Sign-Up Button */}
        <div className="w-full flex justify-center">
          <GoogleAuthButton
            label={t('continueWithGoogle')}
            onCredential={loginWithGoogle}
            onError={() => showToast.error(t('googleLoginFailed') || 'Đăng nhập Google thất bại')}
            disabled={isRegistering}
          />
        </div>
      </motion.form>

      {/* Footer Link */}
      <motion.p
        variants={itemVariants}
        className="text-center font-[family-name:var(--font-lora)] text-[11px] sm:text-xs text-[var(--text-light)]"
      >
        {t('alreadyHaveAccount')}{' '}
        <Link
          href="/login"
          className="font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors underline decoration-[var(--primary-color)]/20 underline-offset-4"
        >
          {t('loginNow')}
        </Link>
      </motion.p>
    </>
  );
}
