import React from 'react';
import { AuthImageBanner } from '@/features/auth/components/AuthImageBanner';
import { RegisterForm } from '@/features/auth/components/register/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[45%_55%]">
      <AuthImageBanner imageSrc="/images/login4.jpg" imagePosition="center 10%" showBlossoms={true} />
      <RegisterForm />
    </div>
  );
}
