import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

export default function CheckoutPage() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <h1>Thanh toán</h1>
      <p className="mt-3 max-w-2xl text-[var(--text-light)]">
        Hoàn tất thông tin giao hàng và phương thức thanh toán.
      </p>
    </Container>
  );
}
