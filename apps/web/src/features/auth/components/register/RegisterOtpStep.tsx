import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { AuthHeader } from '../AuthHeader';
import { authItemVariants } from '../AuthFormShell';
import { AuthSubmitButton } from '../AuthSubmitButton';
import { AuthBackAction } from '../AuthBackAction';
import { AuthResendRow } from '../AuthResendRow';
import { AuthOtpField } from '../AuthOtpField';

export interface RegisterOtpStepProps {
  /** Mã được gửi qua email hay SMS */
  channel: 'email' | 'phone';
  /** Email / SĐT nhận mã */
  destination: string;
  otpValue: string;
  setOtpValue: (val: string) => void;
  otpError: string;
  /** Số giây còn lại trước khi được gửi lại mã */
  resendSeconds: number;
  isResending: boolean;
  isRegistering: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
  handleVerifyOtp: (e: React.FormEvent) => void;
  handleResend: () => void;
  setIsOtpStep: (val: boolean) => void;
}

export function RegisterOtpStep({
  channel,
  destination,
  otpValue,
  setOtpValue,
  otpError,
  resendSeconds,
  isResending,
  isRegistering,
  t,
  handleVerifyOtp,
  handleResend,
  setIsOtpStep,
}: RegisterOtpStepProps) {
  return (
    <>
      <AuthHeader
        title={channel === 'email' ? t('emailCodeTitle') : t('otpTitle')}
        subtitle={
          <>
            {channel === 'email' ? t('emailCodeSentTo') : t('smsSent')}{' '}
            <span className="font-semibold text-[var(--text-main)]">{destination}</span>
          </>
        }
      />

      <motion.form variants={authItemVariants} onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
        <AuthOtpField value={otpValue} onChange={setOtpValue} error={otpError || undefined} disabled={isRegistering} />

        <AuthResendRow
          seconds={resendSeconds}
          resending={isResending}
          disabled={isRegistering}
          onResend={handleResend}
          t={t}
        />

        <AuthSubmitButton loading={isRegistering} icon={<ShieldCheck />}>
          {isRegistering ? t('verifying') : t('verifyButton')}
        </AuthSubmitButton>
      </motion.form>

      <motion.div variants={authItemVariants}>
        <AuthBackAction onClick={() => setIsOtpStep(false)} disabled={isRegistering} label={t('backToForm')} />
      </motion.div>
    </>
  );
}
