import React from 'react';
import { AuthImageBanner, ForgotForm } from '@/features/auth';

export default function ForgotPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthImageBanner imageSrc="/images/login2.jpg" imagePosition="center 5%"/>
      <ForgotForm />
    </div>
  );
}
