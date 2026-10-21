import React from 'react';
import { Container } from '@/components/layout/Container';
import { CheckoutExperience } from '@/features/checkout';
import { ClientMessages, CLIENT_NAMESPACES } from '@/i18n/ClientMessages';

export default function CheckoutPage() {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.checkout}>
      <Container as="section" width="full">
        <CheckoutExperience />
      </Container>
    </ClientMessages>
  );
}
