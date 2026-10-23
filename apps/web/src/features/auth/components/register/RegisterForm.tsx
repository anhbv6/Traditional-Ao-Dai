'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRegister } from '../../hooks/useRegister';
import { RegisterFormStep } from './RegisterFormStep';
import { RegisterOtpStep } from './RegisterOtpStep';
import { AuthFormShell, authItemVariants } from '../AuthFormShell';

import { Volume2, VolumeOff } from 'lucide-react';

export function RegisterForm() {
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
        .catch(() => {
          // Trình duyệt chặn tự phát -> hiện nút phát cho khách bấm
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
    isCheckingPhone,
    phoneCheckResult,
    isRegistering,
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    errors,
    submitCount,
    registerType,
    onFormSubmit,
    handleVerifyOtp,
    handleResendOtp,
    handleGoogleSignUp,
    isResendingOtp,
    resendSeconds,
    otpSentOnce,
    codeDestination,
  } = useRegister();

  return (
    <AuthFormShell loading={isRegistering}>
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
          submitCount={submitCount}
          isRegistering={isRegistering}
          isCheckingEmail={isCheckingEmail}
          isCheckingPhone={isCheckingPhone}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          emailCheckResult={emailCheckResult}
          phoneCheckResult={phoneCheckResult}
          loginWithGoogle={handleGoogleSignUp}
          itemVariants={authItemVariants}
          setIsOtpStep={setIsOtpStep}
          otpSentOnce={otpSentOnce}
        />
      ) : (
        <RegisterOtpStep
          channel={registerType}
          destination={codeDestination}
          otpValue={otpInput}
          setOtpValue={setOtpInput}
          otpError={otpError}
          resendSeconds={resendSeconds}
          isResending={isResendingOtp}
          isRegistering={isRegistering}
          t={t}
          handleVerifyOtp={handleVerifyOtp}
          handleResend={handleResendOtp}
          setIsOtpStep={setIsOtpStep}
        />
      )}

      {/* Floating Audio Toggle Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="fixed bottom-6 right-6 z-50 flex size-10 cursor-pointer items-center justify-center rounded-full border border-[var(--primary-color)]/20 bg-[var(--primary-color)] text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Toggle music"
      >
        {isPlaying ? <Volume2 className="size-5 animate-pulse" /> : <VolumeOff className="size-5" />}
      </button>
    </AuthFormShell>
  );
}
export default RegisterForm;
