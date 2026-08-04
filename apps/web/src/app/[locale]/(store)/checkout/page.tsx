import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CheckoutPageClient } from '@/features/checkout/components/CheckoutPageClient';

export default function CheckoutPage() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <CheckoutPageClient />
    </Container>
  );
}
