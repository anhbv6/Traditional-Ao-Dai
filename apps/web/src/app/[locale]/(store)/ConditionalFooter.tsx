'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface ConditionalFooterProps {
  children: ReactNode;
}

export function ConditionalFooter({ children }: ConditionalFooterProps) {
  const pathname = usePathname();
  
  // Check if pathname contains "/profile"
  const isProfile = pathname?.split('/').includes('profile');

  if (isProfile) {
    return null;
  }

  return <>{children}</>;
}
