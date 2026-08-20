import React from 'react';
import { AuthImageBanner } from '@/features/auth/components/AuthImageBanner';
import { LoginForm } from '@/features/auth/components/login/LoginForm';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[45%_55%]">
      <AuthImageBanner imageSrc="/images/login1.jpg" imagePosition="center 35%"/>
      <LoginForm />
    </div>
  );
}
