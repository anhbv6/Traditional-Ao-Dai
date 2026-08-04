import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CartPageClient } from '@/features/cart/components/CartPageClient';

export default function CartPage() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <CartPageClient />
    </Container>
  );
}
