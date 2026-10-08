import React from 'react';
import { AuthImageBanner, RegisterForm } from '@/features/auth';

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[45%_55%]">
      <AuthImageBanner imageSrc="/images/login4.jpg" imagePosition="center 10%" showBlossoms={true} />
      <RegisterForm />
    </div>
  );
}
