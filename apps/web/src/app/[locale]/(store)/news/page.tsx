import React from 'react';
import { NewsClient } from '@/features/news';
import { Container } from '@/components/layout/Container';
import { ClientMessages, CLIENT_NAMESPACES } from '@/i18n/ClientMessages';

export default function NewsPage() {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.news}>
      <Container as="section">
        <NewsClient />
      </Container>
    </ClientMessages>
  );
}
