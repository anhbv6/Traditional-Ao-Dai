import React from 'react';
import { AuthImageBanner } from '@/features/auth/components/AuthImageBanner';
import { ChangePasswordForm } from '@/features/auth/components/forgot/ChangePasswordForm';

export default function ChangePasswordPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthImageBanner />
      <ChangePasswordForm />
    </div>
  );
}