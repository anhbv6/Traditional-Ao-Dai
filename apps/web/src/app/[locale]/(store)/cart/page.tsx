import React from 'react';
import { Container } from '@/components/ui/container';
import { CartExperience } from '@/features/cart';

export default function CartPage() {
  return (
    <Container as="section" className="py-8 sm:py-12">
      <CartExperience />
    </Container>
  );
}
