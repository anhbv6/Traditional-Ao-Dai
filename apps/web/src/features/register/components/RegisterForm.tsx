'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Smartphone, Mail, RefreshCw, CheckCircle2, Info } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { FormInput } from '@/components/shared/FormInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useRegister } from '../hooks/useRegister';
import { Logo } from '@/components/common/header/Logo';
import type { RegisterFormData } from '../types/register.types';
import type { FieldErrors } from 'react-hook-form';

type TooltipChecklistItem = {
  label: string;
  isValid: boolean;
};

function TooltipChecklist({ items }: { items: TooltipChecklistItem[] }) {
  return (
    <ul className="w-full space-y-1.5 text-[11px] font-[family-name:var(--font-lora)] text-zinc-300 py-1 px-0.5 select-none sm:min-w-[220px]">
      {items.map((item, idx) => (
        <li
          key={idx}
          className={cn(
            "flex items-start gap-1.5 transition-all duration-200",
            item.isValid ? "line-through text-emerald-400 opacity-60 font-medium" : "text-zinc-200"
          )}
        >
          <span className={cn(
            "mt-1.5 block size-1.5 rounded-full shrink-0 transition-colors duration-200",
            item.isValid ? "bg-emerald-400" : "bg-zinc-500"
          )} />
          <span className="min-w-0 whitespace-normal break-words leading-relaxed">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

type InlineValidationTooltipProps = {
  id: string;
  content: React.ReactNode;
  isInvalid?: boolean;
  validationTooltipSignal: number;
  validationTooltipTarget?: string;
};

function InlineValidationTooltip({
  id,
  content,
  isInvalid,
  validationTooltipSignal,
  validationTooltipTarget,
}: InlineValidationTooltipProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isManuallyOpen, setIsManuallyOpen] = React.useState(false);
  const [dismissedValidationSignal, setDismissedValidationSignal] = React.useState<number>();
  const [tooltipStyle, setTooltipStyle] = React.useState<React.CSSProperties>();

  const containerRef = React.useRef<HTMLSpanElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const isSubmittedErrorOpen =
    validationTooltipTarget === id &&
    !!isInvalid &&
    validationTooltipSignal > 0 &&
    dismissedValidationSignal !== validationTooltipSignal;

  const tooltipOpen = isSubmittedErrorOpen || isHovered || isManuallyOpen;

  const closeTooltip = React.useCallback(() => {
    setDismissedValidationSignal(validationTooltipSignal);
    setIsManuallyOpen(false);
    setIsHovered(false);
  }, [validationTooltipSignal]);

  React.useLayoutEffect(() => {
    if (!tooltipOpen || !triggerRef.current) return;

    const updateTooltipPosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const viewportPadding = 16;
      const tooltipWidth =
        window.innerWidth < 640
          ? window.innerWidth - viewportPadding * 2
          : Math.min(320, window.innerWidth - viewportPadding * 2);
      const triggerCenter = triggerRect.left + triggerRect.width / 2;
      const tooltipLeft = Math.min(
        Math.max(triggerCenter - 24, viewportPadding),
        window.innerWidth - viewportPadding - tooltipWidth
      );
      const arrowLeft = Math.min(
        Math.max(triggerCenter - tooltipLeft, 12),
        tooltipWidth - 12
      );

      setTooltipStyle({
        '--tooltip-left': `${tooltipLeft}px`,
        '--tooltip-mobile-top': `${triggerRect.bottom + 8}px`,
        '--tooltip-mobile-arrow-left': `${arrowLeft}px`,
        '--tooltip-width': `${tooltipWidth}px`,
      } as React.CSSProperties);
    };

    updateTooltipPosition();
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('orientationchange', updateTooltipPosition);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('orientationchange', updateTooltipPosition);
    };
  }, [tooltipOpen]);

  React.useEffect(() => {
    if (!tooltipOpen) return;

    const handlePointerOutside = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-tooltip-submit="true"]')) {
        return;
      }

      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeTooltip();
      }
    };

    document.addEventListener('pointerdown', handlePointerOutside);
    return () => document.removeEventListener('pointerdown', handlePointerOutside);
  }, [closeTooltip, tooltipOpen]);

  const handleIconClick = (event: React.MouseEvent | React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (tooltipOpen) {
      closeTooltip();
      return;
    }

    setIsManuallyOpen(true);
  };

  return (
    <span ref={containerRef} className="relative inline-block leading-none">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleIconClick}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "inline-flex items-center text-[var(--text-light)] hover:text-[#800020] transition-colors outline-none cursor-pointer mb-0.5 shrink-0",
          isInvalid && "text-rose-500 hover:text-rose-600"
        )}
        aria-label="Info"
      >
        <Info size={12} />
      </button>

      {tooltipOpen && (
        <div
          style={tooltipStyle}
          className="fixed left-[var(--tooltip-left)] top-[var(--tooltip-mobile-top)] z-50 w-[var(--tooltip-width)] max-w-[calc(100vw-2rem)] break-words p-3.5 bg-[#1a191b] text-white text-xs rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-zinc-800"
        >
          <div className="absolute bottom-full left-[var(--tooltip-mobile-arrow-left)] -translate-x-1/2 border-[6px] border-transparent border-b-[#1a191b]" />
          {content}
        </div>
      )}
    </span>
  );
}

export function RegisterForm() {
  const [validationTooltipSignal, setValidationTooltipSignal] = React.useState(0);
  const [validationTooltipTarget, setValidationTooltipTarget] = React.useState<string>();
  const {
    t,
    showPassword,
    setShowPassword,
    isOtpStep,
    setIsOtpStep,
    otpInput,
    setOtpInput,
    otpError,
    isCheckingEmail,
    emailCheckResult,
    emailApiError,
    isCheckingPhone,
    phoneCheckResult,
    phoneApiError,
    isRegistering,
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    errors,
    registerType,
    onFormSubmit,
    handleVerifyOtp,
    handleResendOtp,
    handleGoogleSignUp,
  } = useRegister();

  const fullNameValue = watch('fullName') || '';
  const emailValue = watch('email') || '';
  const phoneValue = watch('phone') || '';
  const passwordValue = watch('password') || '';
  const confirmPasswordValue = watch('confirmPassword') || '';

  // Full name validations
  const fnRequired = fullNameValue.trim().length > 0;
  const fnLength = fullNameValue.length >= 2 && fullNameValue.length <= 50;
  const fnAllValid = fnRequired && fnLength;
  const hasFullNameError = (fullNameValue.length > 0 && !fnAllValid) || !!errors.fullName;
  const isFullNameSuccess = fnAllValid;

  // Email / Phone validations
  const emailRequired = emailValue.trim().length > 0;
  const emailFormat = emailValue.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  const emailAllValid = emailRequired && emailFormat;
  const hasEmailError = (emailValue.length > 0 && !emailAllValid) || !!errors.email || emailCheckResult === 'taken';
  const isEmailSuccess = emailAllValid && emailCheckResult === 'available';
  const emailErrorMessage = errors.email?.message || (emailCheckResult === 'taken' ? (emailApiError || t('emailTaken')) : undefined);

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

  // Map total score (max 6 complexity criteria) to 5 segments:
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] as const } },
  };

  const handleInvalidSubmit = (formErrors: FieldErrors<RegisterFormData>) => {
    const contactField = registerType === 'email' ? 'email' : 'phone';
    const firstInvalidField = ['fullName', contactField, 'password', 'confirmPassword', 'agreeTerms'].find(
      (field) => !!formErrors[field as keyof RegisterFormData]
    );

    setValidationTooltipTarget(firstInvalidField ?? '__none__');
    setValidationTooltipSignal((signal) => signal + 1);
  };

  return (
    <>
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-4 py-8 sm:px-8 sm:py-12 lg:px-16">
        <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[460px] space-y-6 sm:space-y-8 rounded-2xl p-6 sm:p-10"
      >
        {/* Mobile Logo */}
        {!isOtpStep && <div className="flex justify-center lg:hidden">
          <Logo textLogo/>
        </div>}

        {!isOtpStep ? (
          <>
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
            <motion.form
              variants={itemVariants}
              onSubmit={handleSubmit(onFormSubmit, handleInvalidSubmit)}
              className="space-y-5"
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
                    labelAction={
                      <button
                        type="button"
                        onClick={() => {
                          clearErrors();
                          setValue('registerType', 'phone');
                          setValue('email', '');
                          setValue('phone', '');
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors select-none outline-none cursor-pointer"
                      >
                        <Smartphone size={12} />
                        <span>{t('switchPhone')}</span>
                      </button>
                    }
                    placeholder={t('emailPlaceholder')}
                    isInvalid={hasEmailError}
                    error={emailErrorMessage}
                    isSuccess={isEmailSuccess}
                    validationTooltipSignal={validationTooltipSignal}
                    validationTooltipTarget={validationTooltipTarget}
                    tooltipPriority={40}
                    rightElement={
                      <div className="flex items-center">
                        {isCheckingEmail && (
                          <RefreshCw size={14} className="text-[#800020] animate-spin" />
                        )}
                        {!isCheckingEmail && emailCheckResult === 'available' && (
                          <CheckCircle2 size={15} className="text-green-600" />
                        )}
                      </div>
                    }
                    successMessage={
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {t('emailAvailable')}
                      </span>
                    }
                    helperText={
                      isCheckingEmail ? (
                        <span className="flex items-center gap-1 font-semibold text-gray-500">
                          {t('emailChecking')}
                        </span>
                      ) : undefined
                    }
                    {...register('email')}
                  />
                ) : (
                  <FormInput
                    id="phone"
                    type="tel"
                    label={t('phone')}
                    tooltip={phoneTooltip}
                    labelAction={
                      <button
                        type="button"
                        onClick={() => {
                          clearErrors();
                          setValue('registerType', 'email');
                          setValue('email', '');
                          setValue('phone', '');
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors select-none outline-none cursor-pointer"
                      >
                        <Mail size={12} />
                        <span>{t('switchEmail')}</span>
                      </button>
                    }
                    placeholder={t('phonePlaceholder')}
                    isInvalid={hasPhoneError}
                    error={phoneErrorMessage}
                    isSuccess={isPhoneSuccess}
                    validationTooltipSignal={validationTooltipSignal}
                    validationTooltipTarget={validationTooltipTarget}
                    tooltipPriority={40}
                    rightElement={
                      <div className="flex items-center">
                        {isCheckingPhone && (
                          <RefreshCw size={14} className="text-[#800020] animate-spin" />
                        )}
                        {!isCheckingPhone && phoneCheckResult === 'available' && (
                          <CheckCircle2 size={15} className="text-green-600" />
                        )}
                      </div>
                    }
                    successMessage={
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {t('phoneAvailable')}
                      </span>
                    }
                    helperText={
                      isCheckingPhone ? (
                        <span className="flex items-center gap-1 font-semibold text-gray-500">
                          {t('phoneChecking')}
                        </span>
                      ) : undefined
                    }
                    {...register('phone')}
                  />
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
                className="w-full h-12 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-xs uppercase rounded-lg mt-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isRegistering ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>{t('signin')}</span>
                    <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                  </>
                )}
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
                className="w-full h-12 bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 shadow-sm flex items-center justify-center gap-3 font-semibold tracking-wider text-xs uppercase rounded-lg transition-all cursor-pointer"
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
          </>
        ) : (
          /* Phone SMS OTP verification block */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="space-y-3 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#800020]/5 text-[#800020]">
                <Smartphone size={24} />
              </div>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#800020]">
                {t('otpTitle')}
              </h2>
              <p className="font-[family-name:var(--font-lora)] text-xs text-[var(--text-light)] leading-relaxed">
                {t('smsSent')}
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <FormInput
                type="text"
                required
                maxLength={6}
                placeholder={t('otpPlaceholder')}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[8px] text-lg font-bold"
                error={otpError}
                errorPlacement="bottom"
                label={t('otpCode')}
                labelClassName="text-center w-full block"
                containerClassName="space-y-2 text-center"
              />

              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full h-12 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm font-semibold tracking-wider text-xs uppercase rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isRegistering ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  t('verifyButton')
                )}
              </Button>

              <div className="flex justify-between text-xs font-semibold font-[family-name:var(--font-lora)] px-1">
                <button
                  type="button"
                  onClick={() => setIsOtpStep(false)}
                  className="text-[var(--text-light)] hover:text-[#800020] transition-colors cursor-pointer outline-none border-none bg-transparent"
                >
                  {t('back')}
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-[#800020] hover:text-[#800020]/80 transition-colors cursor-pointer outline-none border-none bg-transparent"
                >
                  {t('resendOtp')}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
    </>
  );
}
