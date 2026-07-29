'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { AuthImageBanner } from '@/features/auth/components/AuthImageBanner';
import { ForgotForm } from '@/features/auth/components/ForgotForm';
import { VerifyOtpForm } from '@/features/auth/components/VerifyOtpForm';

export default function ForgotPage() {
  const router = useRouter();
  const [step, setStep] = useState<'forgot' | 'verify'>('forgot');
  const [email, setEmail] = useState('');

  const handleForgotSubmit = (submittedEmail: string) => {
    setEmail(submittedEmail);
    // Add a tiny delay to allow forgot form submit animation to finish
    setTimeout(() => {
      setStep('verify');
    }, 600);
  };

  const handleVerifySuccess = () => {
    router.push('/changePassword');
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthImageBanner />
      {step === 'forgot' ? (
        <ForgotForm onSubmitSuccess={handleForgotSubmit} />
      ) : (
        <VerifyOtpForm email={email} onVerifySuccess={handleVerifySuccess} />
      )}
    </div>
  );
}