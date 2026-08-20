import React from 'react';
import { NewsClient } from '@/features/news';
import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

export default function NewsPage() {
  return (
    <Container as="section" className="py-8 sm:py-12">
      <Breadcrumbs />
      <NewsClient />
    </Container>
  );
}
