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

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const t = await getTranslations('NewsPage');

  // Find the current article
  const article = mockArticles.find((item) => item.slug === slug);

  if (!article) {
    return (
      <Container as="div" className="py-16 text-center">
        <Breadcrumbs />
        <h1 className="mt-8 text-2xl font-bold font-[family-name:var(--font-playfair)] text-[var(--primary-color)]">
          {t('articleNotFound')}
        </h1>
        <Link
          href="/news"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-color)] hover:underline"
        >
          <ArrowLeft size={16} />
          {t('backToNews')}
        </Link>
      </Container>
    );
  }

  // Get similar articles (excluding current article, limit to 3)
  const similarArticles = mockArticles
    .filter((item) => item.id !== article.id)
    .slice(0, 3);

  return <NewsDetail article={article} similarArticles={similarArticles} />;
}
