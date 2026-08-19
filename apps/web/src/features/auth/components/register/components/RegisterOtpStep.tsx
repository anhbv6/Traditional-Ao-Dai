import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineValidationTooltip } from './InlineValidationTooltip';

export interface RegisterOtpStepProps {
  phoneValue: string;
  otpArray: string[];
  inputRefs: React.RefObject<(HTMLInputElement | null)[]>;
  otpError: string;
  timer: number;
  canResend: boolean;
  isRegistering: boolean;
  t: (key: string, values?: any) => string;
  handleVerifyOtp: (e: React.FormEvent) => void;
  handleChange: (val: string, idx: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, idx: number) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  handleResend: () => void;
  setIsOtpStep: (val: boolean) => void;
}

export function RegisterOtpStep({
  phoneValue,
  otpArray,
  inputRefs,
  otpError,
  timer,
  canResend,
  isRegistering,
  t,
  handleVerifyOtp,
  handleChange,
  handleKeyDown,
  handlePaste,
  handleResend,
  setIsOtpStep,
}: RegisterOtpStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-3 text-center lg:text-left">
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--primary-color)] sm:text-4xl flex items-center justify-center lg:justify-start gap-1.5">
          <span>{t('otpTitle')}</span>
          <InlineValidationTooltip
            id="otpCode"
            content={<div className="font-[family-name:var(--font-lora)] text-[11px] font-semibold leading-relaxed text-zinc-100">{otpError}</div>}
            isInvalid={!!otpError}
            validationTooltipSignal={otpError ? 1 : 0}
            validationTooltipTarget={otpError ? 'otpCode' : undefined}
          />
        </h2>
        <p className="font-[family-name:var(--font-lora)] text-sm text-[var(--text-light)] leading-relaxed">
          {t('smsSent')}{' '}
          <span className="font-semibold text-[var(--text-main)]">{phoneValue}</span>
        </p>
      </div>

      <form onSubmit={handleVerifyOtp} className="space-y-6">
        {/* OTP Code Inputs */}
        <div className="flex justify-between gap-1.5 sm:gap-3">
          {otpArray.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              value={digit}
              ref={(el) => {
                if (inputRefs.current) {
                  inputRefs.current[idx] = el;
                }
              }}
              onChange={(e) => handleChange(e.target.value, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPaste={idx === 0 ? handlePaste : undefined}
              className="w-[calc((100%-1.25rem)/6)] max-w-14 aspect-square sm:h-16 text-center text-lg sm:text-xl font-semibold rounded-lg border border-[var(--border)] bg-background text-[var(--text-main)] shadow-none outline-none transition-all focus:border-[var(--primary-color)] focus:bg-white focus:ring-2 focus:ring-[var(--ring)]/30"
            />
          ))}
        </div>

        {/* Resend Action */}
        <div className="flex items-center justify-between font-[family-name:var(--font-lora)] text-xs mt-4">
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
          disabled={otpArray.join('').length < 6 || isRegistering}
          className="w-full h-12 bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/95 shadow-sm transition-all hover:shadow duration-300 flex items-center justify-center gap-2 group/btn font-semibold tracking-wider text-xs uppercase rounded-lg disabled:opacity-50 disabled:pointer-events-none mt-6"
        >
          {isRegistering ? t('verifying') : t('verifyButton')}
        </Button>
      </form>

      {/* Back link */}
      <p className="text-center font-[family-name:var(--font-lora)] text-xs text-[var(--text-light)] mt-6">
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
