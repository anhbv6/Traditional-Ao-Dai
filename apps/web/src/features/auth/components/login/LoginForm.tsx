'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowRight, Loader2, Key, Smartphone } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { FormInput } from '@/components/shared/FormInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { showToast } from '@/components/ui/toast';
import { useLogin } from '../../hooks/useLogin';
import { GoogleAuthButton } from '../GoogleAuthButton';

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

  // Synchronize 6-digit array into hook's OTP input string
  useEffect(() => {
    setOtpInput(otpDigits.join(''));
  }, [otpDigits, setOtpInput]);

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
      login(emailOrPhone, password);
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

  const sendOtpButton = (
    <button
      type="button"
      onClick={() => sendOtpCode(phone)}
      disabled={isLoading || !phone}
      className="mr-2 px-3 py-1 bg-[#800020] text-white text-[10px] font-bold rounded-md hover:bg-[#800020]/95 transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
    >
      {otpSent ? t('resendOtp') : t('sendOtp')}
    </button>
  );

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-3.5 py-6 sm:px-8 sm:py-12 lg:px-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[440px] space-y-5 sm:space-y-8 rounded-2xl p-5 sm:p-10"
      >
        {/* Mobile Logo */}
        <div className="flex justify-center lg:hidden">
          <Link href="/" className="flex flex-col items-center gap-1.5">
            <div className="relative h-9 w-9 overflow-hidden rounded-md flex items-center justify-center">
              <Image
                src="/logoPage.png"
                alt="AODAI logo"
                width={70}
                height={70}
                className="h-full w-full object-cover scale-125"
                unoptimized
              />
            </div>
            <span className="font-[family-name:var(--font-playfair)] text-base font-normal tracking-widest text-[var(--primary-color)] uppercase">
              AODAI
            </span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-2 text-center lg:text-left">
          <motion.h2
            variants={itemVariants}
            className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--primary-color)] sm:text-4xl"
          >
            {t('welcomeBack')}
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="font-[family-name:var(--font-lora)] text-xs sm:text-sm text-[var(--text-light)]"
          >
            {t('pleaseLogin')}
          </motion.p>
        </div>

        {/* Login Tabs Selector */}
        <motion.div variants={itemVariants} className="flex border-b border-[var(--border)] select-none">
          <button
            type="button"
            onClick={() => setIsOtpMode(false)}
            className={cn(
              "flex-1 pb-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-wider border-b-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5",
              !isOtpMode
                ? "border-[#800020] text-[#800020] font-bold"
                : "border-transparent text-[var(--text-light)] hover:text-[var(--text-main)]"
            )}
          >
            <Key size={12} className="sm:size-[13px]" />
            <span>{t('loginWithPassword')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOtpMode(true)}
            className={cn(
              "flex-1 pb-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-wider border-b-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5",
              isOtpMode
                ? "border-[#800020] text-[#800020] font-bold"
                : "border-transparent text-[var(--text-light)] hover:text-[var(--text-main)]"
            )}
          >
            <Smartphone size={12} className="sm:size-[13px]" />
            <span>{t('loginWithOtp')}</span>
          </button>
        </motion.div>

        {/* Form */}
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {!isOtpMode ? (
              <>
                {/* Email or Phone Field */}
                <FormInput
                  id="emailOrPhone"
                  type="text"
                  required
                  label={t('emailOrPhone')}
                  placeholder={t('emailOrPhonePlaceholder')}
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                />

                {/* Password Field */}
                <FormInput
                  id="password"
                  type="password"
                  required
                  label={t('password')}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  passwordToggleLabels={{
                    show: t('showPassword'),
                    hide: t('hidePassword'),
                  }}
                />
              </>
            ) : (
              <>
                {/* Phone OTP Field */}
                <FormInput
                  id="phone"
                  type="tel"
                  required
                  label={t('phone')}
                  placeholder={t('phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  rightElement={sendOtpButton}
                />

                {/* 6-digit OTP inputs block */}
                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <label className="block font-[family-name:var(--font-lora)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                      {t('otpCode')}
                    </label>
                    <div className="flex justify-between gap-1.5 sm:gap-3">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          value={digit}
                          ref={(el) => {
                            if (el) inputRefs.current[idx] = el;
                          }}
                          onChange={(e) => handleOtpDigitChange(e.target.value, idx)}
                          onKeyDown={(e) => handleOtpDigitKeyDown(e, idx)}
                          onPaste={idx === 0 ? handleOtpDigitPaste : undefined}
                          className="w-[calc((100%-1.25rem)/6)] max-w-14 aspect-square sm:h-16 text-center text-lg sm:text-xl font-semibold rounded-lg border border-[var(--border)] bg-background text-[var(--text-main)] shadow-none outline-none transition-all focus:border-[var(--primary-color)] focus:bg-white focus:ring-2 focus:ring-[var(--ring)]/30"
                        />
                      ))}
                    </div>
                    {otpError && (
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                        {otpError}
                      </p>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Remember Me & Forgot Password - Only for Password Login */}
          {!isOtpMode && (
            <div className="flex items-center justify-between font-[family-name:var(--font-lora)] text-[11px] sm:text-xs">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                />
                <label
                  htmlFor="remember"
                  className="cursor-pointer text-[var(--text-light)] hover:text-[var(--text-main)] transition-colors select-none font-medium"
                >
                  {t('rememberMe')}
                </label>
              </div>
              <Link
                href="/forgot"
                className="font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors underline decoration-[var(--primary-color)]/20 underline-offset-4"
              >
                {t('forgotPassword')}
              </Link>
            </div>
          )}

          {/* Action Button */}
          <Button
            type="submit"
            disabled={isLoading || (isOtpMode && !otpSent) || (isOtpMode && otpDigits.join('').length < 6)}
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

          {/* Divider */}
          <div className="relative flex py-1.5 sm:py-2.5 items-center">
            <div className="flex-grow border-t border-[var(--border)]"></div>
            <span className="flex-shrink mx-4 text-[var(--text-light)] text-[10px] font-bold uppercase tracking-widest">
              {t('orContinueWith')}
            </span>
            <div className="flex-grow border-t border-[var(--border)]"></div>
          </div>

          {/* Google Login Button */}
          <div className="w-full flex justify-center">
            <GoogleAuthButton
              label={t('continueWithGoogle')}
              onCredential={loginWithGoogle}
              onError={() => showToast.error(t('googleLoginFailed') || 'Đăng nhập Google thất bại')}
              disabled={isLoading}
            />
          </div>
        </motion.form>

        {/* Footer Links */}
        <div className="space-y-2.5 text-center">
          <motion.p
            variants={itemVariants}
            className="font-[family-name:var(--font-lora)] text-[11px] sm:text-xs text-[var(--text-light)]"
          >
            {t('dontHaveAccount')}{' '}
            <Link
              href="/signin"
              className="font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors underline decoration-[var(--primary-color)]/20 underline-offset-4"
            >
              {t('createAccount')}
            </Link>
          </motion.p>
          <motion.p
            variants={itemVariants}
            className="font-[family-name:var(--font-lora)] text-[11px] sm:text-xs"
          >
            <Link
              href="/"
              className="font-medium text-[var(--text-light)] hover:text-[var(--primary-color)] transition-colors underline underline-offset-4 decoration-[var(--text-light)]/20"
            >
              {t('continueAsGuest')}
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
