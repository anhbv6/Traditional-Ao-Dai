import React from 'react';
import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CheckoutExperience } from '@/features/checkout';

export default function CheckoutPage() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <CheckoutExperience />
    </Container>
  );
}
