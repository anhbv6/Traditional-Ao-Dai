'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

type VerifyOtpFormProps = {
  email?: string;
  onVerifySuccess: () => void;
};

export function VerifyOtpForm({
  email = 'user@example.com',
  onVerifySuccess,
}: VerifyOtpFormProps) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Take the last character entered (to allow replacing value)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Clear previous input and focus it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      if (pastedData[i]) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);

    // Focus last filled or next empty
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(60);
    setCanResend(false);
    setOtp(Array(6).fill(''));
    inputRefs.current[0]?.focus();
    console.log('OTP Resent to:', email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) return;

    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      console.log('OTP Verified successfully:', otpCode);
      onVerifySuccess();
    }, 1000);
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
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-4 py-8 sm:px-8 sm:py-12 lg:px-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[460px] space-y-6 sm:space-y-8 rounded-2xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(42,37,37,0.02)]"
      >
        {/* Mobile Logo */}
        <div className="flex justify-center lg:hidden">
          <Link href="/" className="flex flex-col items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-md flex items-center justify-center">
              <Image
                src="/logoPage.png"
                alt="AODAI logo"
                width={80}
                height={80}
                className="h-full w-full object-cover scale-125"
              />
            </div>
            <span className="font-[family-name:var(--font-playfair)] text-lg font-normal tracking-widest text-[var(--primary-color)] uppercase">
              AODAI
            </span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-3 text-center lg:text-left">
          <motion.h2
            variants={itemVariants}
            className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--primary-color)] sm:text-4xl"
          >
            {t('otpTitle')}
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="font-[family-name:var(--font-lora)] text-sm text-[var(--text-light)] leading-relaxed"
          >
            {t('otpSubtitle')}{' '}
            <span className="font-semibold text-[var(--text-main)]">{email}</span>
          </motion.p>
        </div>

        {/* Form */}
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Code Inputs */}
          <div className="flex justify-between gap-1.5 sm:gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => {
                  if (el) inputRefs.current[idx] = el;
                }}
                onChange={(e) => handleChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className="w-[calc((100%-1.25rem)/6)] max-w-14 aspect-square sm:h-16 text-center text-lg sm:text-xl font-semibold rounded-lg border border-[var(--border)] bg-background text-[var(--text-main)] shadow-none outline-none transition-all focus:border-[var(--primary-color)] focus:bg-white focus:ring-2 focus:ring-[var(--ring)]/30"
              />
            ))}
          </div>

          {/* Resend Action */}
          <div className="flex items-center justify-between font-[family-name:var(--font-lora)] text-xs">
            <span className="text-[var(--text-light)]">
              {timer > 0 ? t('resendTimer', { timer }) : t('noCodeReceived')}
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className={`font-semibold transition-colors ${
                canResend
                  ? 'text-[var(--primary-color)] hover:text-[var(--accent-color)] underline underline-offset-4'
                  : 'text-[var(--text-light)]/50 cursor-not-allowed'
              }`}
            >
              {t('resendOtp')}
            </button>
          </div>

          {/* Action Button */}
          <Button
            type="submit"
            disabled={otp.join('').length < 6 || isLoading}
            className="w-full h-12 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-xs uppercase rounded-lg disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? t('verifying') : t('verifyButton')}
          </Button>
        </motion.form>

        {/* Back to Login */}
        <motion.p
          variants={itemVariants}
          className="text-center font-[family-name:var(--font-lora)] text-xs text-[var(--text-light)]"
        >
          <Link
            href="/forgot"
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors group/back"
          >
            <ArrowLeft size={14} className="transition-transform group-hover/back:-translate-x-0.5" />
            <span>{t('backToEmail')}</span>
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
