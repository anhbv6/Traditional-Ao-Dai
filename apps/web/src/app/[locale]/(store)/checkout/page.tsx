import React from 'react';
import { Container } from '@/components/ui/container';
import { CheckoutExperience } from '@/features/checkout';

export default function CheckoutPage() {
  return (
    <Container as="section" className="py-12">
      <CheckoutExperience />
    </Container>
  );
}
