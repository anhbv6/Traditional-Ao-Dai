import React, { ReactNode } from 'react';
import { Footer } from '@/components/common/Footer';
import Header from '@/components/common/Header';
import { ScrollToTopButton } from '@/components/common/ScrollToTopButton';

interface StoreLayoutProps {
  children: ReactNode;
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
