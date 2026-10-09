import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

import { Container } from '@/components/ui/container';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { mockArticles, NewsDetail } from '@/features/news';

type NewsDetailPageProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

const SIMILAR_LIMIT = 3;

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
  const t = await getTranslations('NewsPage');
  const article = findArticle(slug);

  if (!article) {
    return (
      <Container as="div" className="py-16 text-center">
        <Breadcrumbs />
        <h1 className="mt-8 text-2xl font-semibold text-[var(--primary-color)]">{t('articleNotFound')}</h1>
        <Link
          href="/news"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary-color)] hover:underline"
        >
          <ArrowLeft size={16} />
          {t('backToNews')}
        </Link>
      </Container>
    );
  }

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
    <Container as="article" className="max-w-6xl py-8 sm:py-12">
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
