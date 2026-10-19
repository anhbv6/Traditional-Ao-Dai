import React from 'react';
import { Container } from '@/components/ui/container';
import { CartExperience } from '@/features/cart';

export default function CartPage() {
  return (
    <Container as="section" width="full">
      <CartExperience />
    </Container>
  );
}
