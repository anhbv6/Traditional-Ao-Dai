import React, { ReactNode } from 'react';
import { Footer } from '@/components/common/footer/Footer';
import { Header } from '@/components/common/header/Header';
import { ScrollToTopButton } from '@/components/common/ScrollToTopButton';
import { ChatDock } from '@/features/chat';
import { ConditionalFooter } from './ConditionalFooter';
import { ClientMessages, CLIENT_NAMESPACES } from '@/i18n/ClientMessages';

interface StoreLayoutProps {
  children: ReactNode;
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.store}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <ConditionalFooter>
          <Footer />
        </ConditionalFooter>
        <ScrollToTopButton />
        <ChatDock />
      </div>
    </ClientMessages>
  );
}
