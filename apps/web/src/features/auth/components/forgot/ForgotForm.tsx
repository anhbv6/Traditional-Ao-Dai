'use client';

import React, { useState } from 'react';
import { useCountdown } from '../../hooks/useCountdown';

// Sub-components
import { EnterForgotForm } from './EnterForgotForm';
import { VerifyOtpForm } from './VerifyOtpForm';
import { ChangePasswordForm } from './ChangePasswordForm';

type ForgotType = 'email' | 'phone';

export function ForgotForm() {
  const [step, setStep] = useState<'forgot' | 'verify' | 'reset'>('forgot');
  const [forgotType, setForgotType] = useState<ForgotType>('email');
  const [target, setTarget] = useState('');
  const [resetToken, setResetToken] = useState('');
  // Đặt ở cấp cha để quay lại bước nhập rồi vào lại bước OTP vẫn giữ đúng thời gian chờ
  const resendCountdown = useCountdown();

  const handleForgotSubmit = (submittedTarget: string, type: ForgotType) => {
    setTarget(submittedTarget);
    setForgotType(type);
    setResetToken('');
    resendCountdown.start();
    setStep('verify');
  };

  const handleBackToForgot = () => {
    setStep('forgot');
    setResetToken('');
  };

  const handleVerifySuccess = (verifiedResetToken: string) => {
    setResetToken(verifiedResetToken);
    setStep('reset');
  };

  return (
    <>
      {step === 'forgot' && (
        <EnterForgotForm
          defaultIdentifier={target}
          onSubmitSuccess={handleForgotSubmit}
          onGoToOtpStep={() => setStep('verify')}
        />
      )}
      {step === 'verify' && (
        <VerifyOtpForm
          forgotType={forgotType}
          target={target}
          resendSeconds={resendCountdown.seconds}
          onResent={() => resendCountdown.start()}
          onVerifySuccess={handleVerifySuccess}
          onBack={handleBackToForgot}
        />
      )}
      {step === 'reset' && (
        <ChangePasswordForm
          forgotType={forgotType}
          target={target}
          resetToken={resetToken}
          onBack={handleBackToForgot}
        />
      )}
    </>
  );
}
export default ForgotForm;
