'use client';

import React, { useState } from 'react';

// Sub-components
import { EnterForgotForm } from './components/EnterForgotForm';
import { VerifyOtpForm } from './components/VerifyOtpForm';
import { ChangePasswordForm } from './components/ChangePasswordForm';

export function ForgotForm() {
  const [step, setStep] = useState<'forgot' | 'verify' | 'reset'>('forgot');
  const [forgotType, setForgotType] = useState<'email' | 'phone'>('email');
  const [target, setTarget] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleForgotSubmit = (submittedTarget: string, type: 'email' | 'phone') => {
    setTarget(submittedTarget);
    setForgotType(type);
    setResetToken('');
    setTimeout(() => {
      setStep('verify');
    }, 400);
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
