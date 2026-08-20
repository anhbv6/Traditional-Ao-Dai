'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { useLogin } from '../../hooks/useLogin';

// Shared Components
import { AuthHeader } from '../AuthHeader';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';

// Sub-components
import { LoginTabs } from './components/LoginTabs';
import { PasswordLoginForm } from './components/PasswordLoginForm';
import { OtpLoginForm } from './components/OtpLoginForm';
import { LoginRememberForgot } from './components/LoginRememberForgot';
import { LoginSocial } from './components/LoginSocial';
import { LoginFooter } from './components/LoginFooter';

export function LoginForm() {
  const t = useTranslations('Auth');
  const {
    login,
    loginWithOtp,
    loginWithGoogle,
    isLoading,
    isOtpMode,
    setIsOtpMode,
    otpSent,
    setOtpInput,
    otpError,
    sendOtpCode,
  } = useLogin();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // 6-digit OTP States & Refs
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const otpCode = otpDigits.join('');
  const isPasswordLoginIncomplete = !emailOrPhone.trim() || !password;
  const isOtpLoginIncomplete = !phone.trim() || !otpSent || otpCode.length < 6;
  const isSubmitDisabled = isLoading || (isOtpMode ? isOtpLoginIncomplete : isPasswordLoginIncomplete);

  // Synchronize 6-digit array into hook's OTP input string
  useEffect(() => {
    setOtpInput(otpDigits.join(''));
  }, [otpDigits, setOtpInput]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shouldNotifySessionExpired = window.sessionStorage.getItem('auth:session-expired') === 'true';
    if (!shouldNotifySessionExpired) return;

    window.sessionStorage.removeItem('auth:session-expired');
    showToast.error(t('sessionExpired'));
  }, [t]);

  // Focus the first input automatically when OTP sent is triggered
  useEffect(() => {
    if (otpSent) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [otpSent]);

  const handleOtpDigitChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value.substring(value.length - 1);
    setOtpDigits(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpDigitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newOtp = [...otpDigits];
        newOtp[index - 1] = '';
        setOtpDigits(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otpDigits];
        newOtp[index] = '';
        setOtpDigits(newOtp);
      }
    }
  };

  const handleOtpDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
    if (!pastedData) return;

    const newOtp = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      if (pastedData[i]) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtpDigits(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpMode) {
      login(emailOrPhone, password, rememberMe);
    } else {
      loginWithOtp(phone);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] as const } },
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-3.5 py-6 sm:px-8 sm:py-12 lg:px-16 relative">
      <LoadingOverlay visible={isLoading} messageKey="verifying" />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[560px] space-y-5 sm:space-y-8 rounded-2xl p-5 sm:p-10"
      >
        <AuthHeader
          title={t('welcomeBack')}
          subtitle={t('pleaseLogin')}
          itemVariants={itemVariants}
        />
        <LoginTabs isOtpMode={isOtpMode} setIsOtpMode={setIsOtpMode} t={t} itemVariants={itemVariants} />

        {/* Form */}
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {!isOtpMode ? (
              <PasswordLoginForm
                emailOrPhone={emailOrPhone}
                setEmailOrPhone={setEmailOrPhone}
                password={password}
                setPassword={setPassword}
                t={t}
              />
            ) : (
              <OtpLoginForm
                phone={phone}
                setPhone={setPhone}
                otpSent={otpSent}
                otpDigits={otpDigits}
                inputRefs={inputRefs as React.MutableRefObject<HTMLInputElement[]>}
                otpError={otpError}
                handleOtpDigitChange={handleOtpDigitChange}
                handleOtpDigitKeyDown={handleOtpDigitKeyDown}
                handleOtpDigitPaste={handleOtpDigitPaste}
                sendOtpCode={sendOtpCode}
                isLoading={isLoading}
                t={t}
              />
            )}
          </div>

          {!isOtpMode && (
            <LoginRememberForgot
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              t={t}
            />
          )}

          {/* Action Button */}
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full h-10 sm:h-11 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-[11px] sm:text-xs uppercase rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <span>{isOtpMode ? t('verifyAndLogin') : t('login')}</span>
                <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-1" />
              </>
            )}
          </Button>

          <LoginSocial isLoading={isLoading} loginWithGoogle={loginWithGoogle} t={t} />
        </motion.form>

        <LoginFooter t={t} itemVariants={itemVariants} />
      </motion.div>
    </div>
  );
}
export default LoginForm;
