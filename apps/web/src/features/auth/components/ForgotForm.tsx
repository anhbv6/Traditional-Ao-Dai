'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { FormInput } from '@/components/shared/FormInput';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { forgotPasswordEmailApi, sendOtpApi } from '../api/auth.api';
import { HttpError } from '@/lib/api-client';

type ForgotFormProps = {
  onSubmitSuccess?: (target: string, type: 'email' | 'phone') => void;
};

export function ForgotForm({ onSubmitSuccess }: ForgotFormProps) {
  const t = useTranslations('Auth');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVal = identifier.trim();

    if (!cleanVal) {
      showToast.error('Vui lòng nhập email hoặc số điện thoại.');
      return;
    }

    const isEmail = cleanVal.includes('@');
    const type = isEmail ? 'email' : 'phone';

    if (isEmail) {
      if (!cleanVal.includes('.') || cleanVal.length < 5) {
        showToast.error(t('invalidEmail') || 'Email không hợp lệ.');
        return;
      }
    } else {
      const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
      if (!phoneRegex.test(cleanVal)) {
        showToast.error(t('invalidPhone') || 'Số điện thoại không hợp lệ.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isEmail) {
        await forgotPasswordEmailApi(cleanVal);
        showToast.success(t('emailCodeSent') || 'Đã gửi mã xác nhận qua email!');
      } else {
        await sendOtpApi(cleanVal, 'RESET_PASSWORD');
        showToast.success(t('phoneOtpSent') || 'Đã gửi mã OTP khôi phục mật khẩu!');
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(cleanVal, type);
      }
    } catch (err: unknown) {
      console.error(err);
      const payload = err instanceof HttpError ? err.payload : undefined;
      const apiMsg =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : err instanceof Error
            ? err.message
            : 'Có lỗi xảy ra, vui lòng thử lại.';
      showToast.error(apiMsg);
    } finally {
      setIsLoading(false);
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
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-main)] px-4 py-8 sm:px-8 sm:py-12 lg:px-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[460px] space-y-6 sm:space-y-8 rounded-2xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(42,37,37,0.02)] border border-[var(--border)]/40 bg-white"
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
                unoptimized
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
            {t('forgotTitle')}
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="font-[family-name:var(--font-lora)] text-sm text-[var(--text-light)] leading-relaxed"
          >
            Nhập email hoặc số điện thoại của bạn để nhận mã xác thực đặt lại mật khẩu.
          </motion.p>
        </div>

        {/* Input Form */}
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            id="identifier"
            type="text"
            required
            label="Email hoặc Số điện thoại"
            placeholder="example@aodai.vn hoặc 0987654321"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          {/* Action Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-xs uppercase rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>Gửi mã xác nhận</span>
                <Send size={14} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </>
            )}
          </Button>
        </motion.form>

        {/* Back to Login Link */}
        <motion.p
          variants={itemVariants}
          className="text-center font-[family-name:var(--font-lora)] text-xs text-[var(--text-light)]"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors group/back"
          >
            <ArrowLeft size={14} className="transition-transform group-hover/back:-translate-x-0.5" />
            <span>{t('backToLogin')}</span>
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
