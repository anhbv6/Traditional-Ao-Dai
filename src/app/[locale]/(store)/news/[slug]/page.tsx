type NewsDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
      <h1>Chi tiết bài viết</h1>
      <p className="mt-3 text-[var(--text-light)]">Slug: {slug}</p>
    </article>
  );
}
