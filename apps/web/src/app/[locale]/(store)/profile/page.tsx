import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

export default function ProfilePage() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <h1>Tài khoản</h1>
      <p className="mt-3 max-w-2xl text-[var(--text-light)]">
        Quản lý thông tin cá nhân, địa chỉ nhận hàng và tùy chọn mua sắm.
      </p>
    </Container>
  );
}
