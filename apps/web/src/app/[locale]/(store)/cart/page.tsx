import React from 'react';
import { Container } from '@/components/layout/Container';
import { CartExperience } from '@/features/cart';
import { ClientMessages, CLIENT_NAMESPACES } from '@/i18n/ClientMessages';

export default function CartPage() {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.cart}>
      <Container as="section" width="full">
        <CartExperience />
      </Container>
    </ClientMessages>
  );
}
