import React from "react";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import {
  HeroBanner,
  BestSellers,
  FeaturedCollections,
  PromoteFeedBack,
  ArticleNews,
} from "@/features/home";

export default async function Home() {
  const t = await getTranslations('HomePage');

  return (
    <>
      <HeroBanner
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        primaryAction={t('hero.primaryAction')}
        secondaryAction={t('hero.secondaryAction')}
        imageAlt={t('hero.imageAlt')}
        note={t('hero.note')}
        metrics={[
          { value: t('hero.metrics.designs.value'), label: t('hero.metrics.designs.label') },
          { value: t('hero.metrics.fabric.value'), label: t('hero.metrics.fabric.label') },
          { value: t('hero.metrics.fitting.value'), label: t('hero.metrics.fitting.label') },
        ]}
      />
      <Container>
        <BestSellers />
        <FeaturedCollections />
        <PromoteFeedBack />
        <ArticleNews />
      </Container>
    </>
  );
}
