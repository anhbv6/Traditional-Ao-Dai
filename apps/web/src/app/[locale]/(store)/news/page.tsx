import React from 'react';
import { NewsClient } from '@/features/news';
import { Container } from '@/components/ui/container';

export default function NewsPage() {
  return (
    <Container as="section" className="py-8 sm:py-12">
      <NewsClient />
    </Container>
  );
}
