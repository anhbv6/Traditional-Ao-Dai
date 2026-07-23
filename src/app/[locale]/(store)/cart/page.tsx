import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

export default function CartPage() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <h1>Giỏ hàng</h1>
      <p className="mt-3 max-w-2xl text-[var(--text-light)]">
        Kiểm tra các mẫu áo dài đã chọn trước khi thanh toán.
      </p>
    </Container>
  );
}
