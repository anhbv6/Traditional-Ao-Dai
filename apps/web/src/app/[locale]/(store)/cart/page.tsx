import React from 'react';
import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CartExperience } from '@/features/cart';

export default function CartPage() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <CartExperience />
    </Container>
  );
}
