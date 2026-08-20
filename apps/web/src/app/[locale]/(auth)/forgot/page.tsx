import React from 'react';
import { AuthImageBanner } from '@/features/auth/components/AuthImageBanner';
import { ForgotForm } from '@/features/auth/components/forgot/ForgotForm';

export default function ForgotPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthImageBanner imageSrc="/images/login2.jpg" imagePosition="center 5%"/>
      <ForgotForm />
    </div>
  );
}
