import ArticleNews from "@/components/common/home/ArticleNews";
import BestSellers from "@/components/common/home/BestSellers";
import FeaturedCollections from "@/components/common/home/FeaturedCollections";
import { HeroBanner } from "@/components/common/home/HeroBanner";
import PromoteFeedBack from "@/components/common/home/PromoteFeedBack";
import { getTranslations } from "next-intl/server";

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
      <div>
        <BestSellers />
        <FeaturedCollections />
        <PromoteFeedBack />
        <ArticleNews />
      </div>
    </>
  );
}
