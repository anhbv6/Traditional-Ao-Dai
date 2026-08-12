"use client";

import React from 'react';
import { AuthImageBanner } from '@/features/auth/components/AuthImageBanner';
import { RegisterForm } from './RegisterForm';

export function RegisterExperience() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthImageBanner />
      <RegisterForm />
    </div>
  );
}
