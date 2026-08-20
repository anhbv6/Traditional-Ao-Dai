'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
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

  // Timer states for Resending OTP
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const phoneValue = watch('phone') || '';

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

  // Trigger actions when OTP step opens
  useEffect(() => {
    if (isOtpStep) {
      setTimer(60); // 60s cooldown
      setCanResend(false);
      setOtpInput('');
    }
  }, [isOtpStep, setOtpInput]);

  const handleResend = async () => {
    await handleResendOtp();
    setTimer(60);
    setCanResend(false);
    setOtpInput('');
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
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-3.5 py-6 sm:px-8 sm:py-12 lg:px-16 relative">
      <LoadingOverlay
        visible={isRegistering}
        messageKey={isOtpStep ? 'verifying' : 'updating'}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[560px] space-y-5 sm:space-y-8 rounded-2xl p-5 sm:p-10"
      >
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
            otpValue={otpInput}
            setOtpValue={setOtpInput}
            otpError={otpError}
            timer={timer}
            canResend={canResend}
            isRegistering={isRegistering}
            t={t}
            handleVerifyOtp={handleVerifyOtp}
            handleResend={handleResend}
            setIsOtpStep={setIsOtpStep}
          />
        )}
      </motion.div>
    </div>
  );
}
export default RegisterForm;
