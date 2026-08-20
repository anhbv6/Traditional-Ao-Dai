import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineValidationTooltip } from './InlineValidationTooltip';
import { OtpInput } from '@/components/shared/OtpInput';

export interface RegisterOtpStepProps {
  phoneValue: string;
  otpValue: string;
  setOtpValue: (val: string) => void;
  otpError: string;
  timer: number;
  canResend: boolean;
  isRegistering: boolean;
  t: (key: string, values?: any) => string;
  handleVerifyOtp: (e: React.FormEvent) => void;
  handleResend: () => void;
  setIsOtpStep: (val: boolean) => void;
}

export function RegisterOtpStep({
  phoneValue,
  otpValue,
  setOtpValue,
  otpError,
  timer,
  canResend,
  isRegistering,
  t,
  handleVerifyOtp,
  handleResend,
  setIsOtpStep,
}: RegisterOtpStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--primary-color)] sm:text-4xl flex items-center justify-center lg:justify-start gap-1.5">
          <span>{t('otpTitle')}</span>
        </h2>
        <p className="font-[family-name:var(--font-lora)] text-xs sm:text-sm text-[var(--text-light)] leading-relaxed">
          {t('smsSent')}{' '}
          <span className="font-semibold text-[var(--text-main)]">{phoneValue}</span>
        </p>
      </div>

      <form onSubmit={handleVerifyOtp} className="space-y-5">
        {/* OTP Code Inputs */}
        <OtpInput
          value={otpValue}
          onChange={setOtpValue}
          isInvalid={!!otpError}
          disabled={isRegistering}
        />

        {/* Resend Action */}
        <div className="flex items-center justify-between font-[family-name:var(--font-lora)] text-[11px] sm:text-xs mt-3">
          <span className="text-[var(--text-light)]">
            {timer > 0 ? t('resendTimer', { timer }) : t('noCodeReceived')}
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className={`cursor-pointer font-semibold transition-colors ${
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
          disabled={otpValue.length < 6 || isRegistering}
          className="w-full h-10 sm:h-11 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-[11px] sm:text-xs uppercase rounded-lg disabled:opacity-50 disabled:pointer-events-none mt-5"
        >
          {isRegistering ? t('verifying') : t('verifyButton')}
        </Button>
      </form>

      {/* Back link */}
      <p className="text-center font-[family-name:var(--font-lora)] text-[11px] sm:text-xs text-[var(--text-light)] mt-5">
        <button
          type="button"
          onClick={() => setIsOtpStep(false)}
          className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors group/back outline-none border-none bg-transparent cursor-pointer"
        >
          <ArrowLeft size={14} className="transition-transform group-hover/back:-translate-x-0.5" />
          <span>{t('back')}</span>
        </button>
      </p>
    </motion.div>
  );
}
