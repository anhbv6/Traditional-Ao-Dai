'use client';

import React, { useState } from 'react';
import { AuthImageBanner } from '@/features/auth/components/AuthImageBanner';
import { ForgotForm } from '@/features/auth/components/forgot/ForgotForm';
import { VerifyOtpForm } from '@/features/auth/components/forgot/VerifyOtpForm';
import { ChangePasswordForm } from '@/features/auth/components/forgot/ChangePasswordForm';

export default function ForgotPage() {
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
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthImageBanner />
      {step === 'forgot' && (
        <ForgotForm onSubmitSuccess={handleForgotSubmit} />
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
    </div>
  );
}
