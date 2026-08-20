import React from 'react';
import { AuthImageBanner } from '@/features/auth/components/AuthImageBanner';
import { LoginForm } from '@/features/auth/components/login/LoginForm';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthImageBanner />
      <LoginForm />
    </div>
  );
}