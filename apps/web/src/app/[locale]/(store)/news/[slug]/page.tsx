import React from 'react';
import { notFound } from 'next/navigation';

import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { mockArticles, NewsDetail } from '@/features/news';

type NewsDetailPageProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

const SIMILAR_LIMIT = 6;

const findArticle = (slug: string) => mockArticles.find((item) => item.slug === decodeURIComponent(slug));

export async function generateMetadata({ params }: NewsDetailPageProps) {
  const { slug, locale } = await params;
  const article = findArticle(slug);
  if (!article) return { title: 'Tin tức - Traditional Ao Dai' };

  const loc = locale === 'en' ? 'en' : 'vi';
  return {
    title: `${article.title[loc]} - Traditional Ao Dai`,
    description: article.description[loc],
    openGraph: {
      type: 'article',
      title: article.title[loc],
      description: article.description[loc],
      images: [article.imageSrc],
    },
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug, locale } = await params;
  const article = findArticle(slug);

  // Bài không tồn tại → trang 404 chung của storefront (có header / footer, đã dịch)
  if (!article) notFound();

  // Danh sách sắp mới -> cũ: bài trước = mới hơn, bài sau = cũ hơn
  const index = mockArticles.findIndex((item) => item.id === article.id);
  const previousArticle = mockArticles[index - 1] ?? null;
  const nextArticle = mockArticles[index + 1] ?? null;

  // Bài liên quan: ưu tiên cùng danh mục, thiếu thì bù bằng bài mới nhất
  const others = mockArticles.filter((item) => item.id !== article.id);
  const similarArticles = [
    ...others.filter((item) => item.category.en === article.category.en),
    ...others.filter((item) => item.category.en !== article.category.en),
  ].slice(0, SIMILAR_LIMIT);

  const loc = locale === 'en' ? 'en' : 'vi';

  return (
    <Container as="article" width="narrow">
      <Breadcrumbs lastLabel={article.title[loc]} />
      <div className="mt-6 sm:mt-8">
        <NewsDetail
          key={article.id}
          article={article}
          similarArticles={similarArticles}
          previousArticle={previousArticle}
          nextArticle={nextArticle}
        />
      </div>
    </Container>
  );
}
