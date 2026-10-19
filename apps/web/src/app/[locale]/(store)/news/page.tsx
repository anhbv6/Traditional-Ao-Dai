import React from 'react';
import { NewsClient } from '@/features/news';
import { Container } from '@/components/ui/container';

export default function NewsPage() {
  return (
    <Container as="section">
      <NewsClient />
    </Container>
  );
}
