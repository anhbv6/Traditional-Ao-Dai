import React from 'react';
import { AuthImageBanner, ChangePasswordForm } from '@/features/auth';

export default function ChangePasswordPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthImageBanner />
      <ChangePasswordForm />
    </div>
  );
}