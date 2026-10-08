import React from 'react';
import { motion } from 'motion/react';
import { FormInput } from '@/components/shared/FormInput';

interface OtpLoginFormProps {
  phone: string;
  setPhone: (val: string) => void;
  otpSent: boolean;
  otpDigits: string[];
  inputRefs: React.MutableRefObject<HTMLInputElement[]>;
  otpError: string | null;
  handleOtpDigitChange: (value: string, index: number) => void;
  handleOtpDigitKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  handleOtpDigitPaste: (e: React.ClipboardEvent) => void;
  sendOtpCode: (phone: string) => void;
  isLoading: boolean;
  t: (key: string) => string;
}

export function OtpLoginForm({
  phone,
  setPhone,
  otpSent,
  otpDigits,
  inputRefs,
  handleOtpDigitChange,
  handleOtpDigitKeyDown,
  handleOtpDigitPaste,
  sendOtpCode,
  isLoading,
  t,
}: OtpLoginFormProps) {
  const sendOtpButton = (
    <button
      type="button"
      onClick={() => sendOtpCode(phone)}
      disabled={isLoading || !phone}
      className="mr-3 px-1 bg-transparent text-[11px] font-bold select-none transition-all duration-200 shrink-0 border-none outline-none focus:outline-none disabled:cursor-not-allowed cursor-pointer text-[var(--primary-color)] hover:text-[var(--primary-color)]/80 disabled:text-[var(--text-light)]/40"
    >
      {otpSent ? t('resendOtp') : t('sendOtp')}
    </button>
  );

  return (
    <>
      {/* Phone OTP Field */}
      <FormInput
        id="phone"
        type="tel"
        required
        label={t('phone')}
        placeholder={t('loginPhonePlaceholder')}
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
        </motion.div>
      )}
    </>
  );
}
export default OtpLoginForm;
