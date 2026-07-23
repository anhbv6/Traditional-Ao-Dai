import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

export default function WishlistPage() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <h1>Danh sách yêu thích</h1>
      <p className="mt-3 max-w-2xl text-[var(--text-light)]">
        Lưu lại các thiết kế áo dài bạn muốn xem lại.
      </p>
    </Container>
  );
}
