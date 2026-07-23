import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

export default function NewsPage() {
  return (
    <Container as="section" className="py-12">
      <Breadcrumbs />
      <h1>Tin tức</h1>
      <p className="mt-3 max-w-2xl text-[var(--text-light)]">
        Cập nhật câu chuyện, xu hướng và hướng dẫn chọn áo dài.
      </p>
    </Container>
  );
}
