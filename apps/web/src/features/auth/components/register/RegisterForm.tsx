/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRegister } from '../../hooks/useRegister';
import { RegisterFormStep } from './components/RegisterFormStep';
import { RegisterOtpStep } from './components/RegisterOtpStep';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';

import { Volume2, VolumeOff } from 'lucide-react';

export function RegisterForm() {
  const [validationTooltipSignal, setValidationTooltipSignal] = useState(0);
  const [validationTooltipTarget, setValidationTooltipTarget] = useState<string>();

  // Audio Player states and refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Instantiate Audio
    const audio = new Audio('/thanh_tan.mp3');
    audio.loop = true;
    audioRef.current = audio;

    // Autoplay when mounting (navigating from Login to Register)
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.log('Autoplay was prevented by browser policy:', error);
          setIsPlaying(false);
        });
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Failed to play audio:', err);
        });
    }
  };

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

      {/* Floating Audio Toggle Button */}
      <button
        onClick={togglePlay}
        className="fixed bottom-6 right-6 z-50 flex size-10 items-center justify-center rounded-full bg-[#800020] text-white shadow-lg border border-[#800020]/20 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
        aria-label="Toggle music"
      >
        {isPlaying ? (
          <Volume2 className="size-5 animate-pulse" />
        ) : (
          <VolumeOff className="size-5" />
        )}
      </button>
    </div>
  );
}
export default RegisterForm;
