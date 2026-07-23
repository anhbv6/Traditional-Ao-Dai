import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';

type NewsDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;

  return (
    <Container as="article" className="max-w-3xl py-12">
      <Breadcrumbs />
      <h1>Chi tiết bài viết</h1>
      <p className="mt-3 text-[var(--text-light)]">Slug: {slug}</p>
    </Container>
  );
}
