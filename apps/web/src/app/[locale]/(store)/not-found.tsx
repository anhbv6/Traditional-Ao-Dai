import { Container } from '@/components/ui/container';
import { NotFoundView } from '@/components/common/NotFoundView';

/**
 * 404 của storefront — hiện trong layout cửa hàng (có header / footer), đã dịch theo ngôn ngữ.
 * Dùng cho: URL không khớp route nào (`[...rest]/page.tsx` gọi `notFound()`) và các trang tự gọi `notFound()`
 * (sản phẩm / bài viết không tồn tại).
 */
export default function StoreNotFound() {
  return (
    <Container as="section" spacing="section">
      <NotFoundView />
    </Container>
  );
}
