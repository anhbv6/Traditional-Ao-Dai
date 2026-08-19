'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Logo } from '@/components/common/header/Logo';
import { type RegisterFormData } from '../../types/register.types';
import { useRegister } from '../../hooks/useRegister';
import { RegisterFormStep } from './components/RegisterFormStep';
import { RegisterOtpStep } from './components/RegisterOtpStep';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';

export function RegisterForm() {
  const [validationTooltipSignal, setValidationTooltipSignal] = useState(0);
  const [validationTooltipTarget, setValidationTooltipTarget] = useState<string>();

  const {
    t,
    router,
    showPassword,
    setShowPassword,
    isOtpStep,
    setIsOtpStep,
    otpInput,
    setOtpInput,
    otpError,
    setOtpError,
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
    otpSentOnce,
  } = useRegister();

  // OTP Verification States & Refs
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer states for Resending OTP
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const phoneValue = watch('phone') || '';

  // Synchronize 6-digit array into hook's OTP input string
  useEffect(() => {
    setOtpInput(otpArray.join(''));
  }, [otpArray, setOtpInput]);

  // Handle countdown timer for Resend OTP
  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-focus first input when OTP step opens
  useEffect(() => {
    if (isOtpStep) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      setTimer(60); // 60s cooldown
      setCanResend(false);
      setOtpArray(Array(6).fill(''));
    }
  }, [isOtpStep]);

  const handleChange = (val: string, idx: number) => {
    // Only accept numeric digits
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otpArray];
    newOtp[idx] = val.slice(-1);
    setOtpArray(newOtp);

    // Auto-focus next input
    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otpArray];
      if (!otpArray[idx] && idx > 0) {
        // Clear previous input and focus it
        newOtp[idx - 1] = '';
        setOtpArray(newOtp);
        inputRefs.current[idx - 1]?.focus();
      } else {
        // Clear current input
        newOtp[idx] = '';
        setOtpArray(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtpArray(pastedData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    await handleResendOtp();
    setTimer(60);
    setCanResend(false);
    setOtpArray(Array(6).fill(''));
  };

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

  const handleInvalidSubmit = (formErrors: any) => {
    const contactField = registerType === 'email' ? 'email' : 'phone';
    const firstInvalidField = ['fullName', contactField, 'password', 'confirmPassword', 'agreeTerms'].find(
      (field) => !!formErrors[field]
    );

    setValidationTooltipTarget(firstInvalidField ?? '__none__');
    setValidationTooltipSignal((signal) => signal + 1);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-4 py-8 sm:px-8 sm:py-12 lg:px-16 relative">
      <LoadingOverlay
        visible={isRegistering}
        messageKey={isOtpStep ? 'verifying' : 'updating'}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[460px] space-y-6 sm:space-y-8 rounded-2xl p-6 sm:p-10"
      >
        {/* Mobile Logo */}
        {!isOtpStep && (
          <div className="flex justify-center lg:hidden">
            <Logo textLogo />
          </div>
        )}

        {!isOtpStep ? (
          <RegisterFormStep
            t={t}
            register={register}
            handleSubmit={handleSubmit}
            errors={errors}
            watch={watch}
            setValue={setValue}
            clearErrors={clearErrors}
            registerType={registerType}
            onFormSubmit={onFormSubmit}
            handleInvalidSubmit={handleInvalidSubmit}
            isRegistering={isRegistering}
            isCheckingEmail={isCheckingEmail}
            isCheckingPhone={isCheckingPhone}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            emailCheckResult={emailCheckResult}
            emailApiError={emailApiError}
            phoneCheckResult={phoneCheckResult}
            phoneApiError={phoneApiError}
            validationTooltipSignal={validationTooltipSignal}
            validationTooltipTarget={validationTooltipTarget}
            loginWithGoogle={handleGoogleSignUp}
            itemVariants={itemVariants}
            setIsOtpStep={setIsOtpStep}
            otpSentOnce={otpSentOnce}
          />
        ) : (
          <RegisterOtpStep
            phoneValue={phoneValue}
            otpArray={otpArray}
            inputRefs={inputRefs}
            otpError={otpError}
            timer={timer}
            canResend={canResend}
            isRegistering={isRegistering}
            t={t}
            handleVerifyOtp={handleVerifyOtp}
            handleChange={handleChange}
            handleKeyDown={handleKeyDown}
            handlePaste={handlePaste}
            handleResend={handleResend}
            setIsOtpStep={setIsOtpStep}
          />
        )}
      </motion.div>
    </div>
  );
}
