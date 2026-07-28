import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

export default function OrdersPage() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <h1>Lịch sử đơn hàng</h1>
      <p className="mt-3 max-w-2xl text-[var(--text-light)]">
        Theo dõi trạng thái may, đóng gói và giao nhận đơn hàng.
      </p>
    </Container>
  );
}
