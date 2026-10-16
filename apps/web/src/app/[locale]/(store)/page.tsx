import React from "react";
import { getTranslations } from "next-intl/server";
import {
  HeroBanner,
  HeroSlider,
  HomeStage,
  HomeStageNav,
  HomeTrustStrip,
  FeaturedCollections,
  BestSellers,
  CraftStory,
  BespokeService,
  PromoteFeedBack,
  ArticleNews,
} from "@/features/home";

/**
 * Trình tự màn home theo mạch kể chuyện:
 * Cảm xúc (hero) → Niềm tin (cam kết) → Cảm hứng (BST) → Lựa chọn (bán chạy) →
 * Giá trị (hành trình thủ công) → Hành động (may đo) → Bằng chứng (đánh giá) → Nội dung (bản tin).
 * Nền xen kẽ kem / trắng / đỏ đô / be để mỗi khối có nhịp riêng, tránh cảm giác một dải dài đơn điệu.
 */
export default async function Home() {
  const t = await getTranslations('HomePage');

  return (
    <>
      <HomeStage id="hero">
        <HeroBanner
          eyebrow={t('hero.eyebrow')}
          title={t('hero.title')}
          subtitle={t('hero.subtitle')}
          primaryAction={t('hero.primaryAction')}
          secondaryAction={t('hero.secondaryAction')}
          media={<HeroSlider />}
          scrollLabel={t('hero.scroll')}
          metrics={[
            { value: t('hero.metrics.designs.value'), label: t('hero.metrics.designs.label') },
            { value: t('hero.metrics.fabric.value'), label: t('hero.metrics.fabric.label') },
            { value: t('hero.metrics.fitting.value'), label: t('hero.metrics.fitting.label') },
          ]}
        />
      </HomeStage>
      <HomeTrustStrip />
      <HomeStage id="collections">
        <FeaturedCollections />
      </HomeStage>
      <HomeStage id="bestSellers">
        <BestSellers />
      </HomeStage>
      <HomeStage id="craft">
        <CraftStory />
      </HomeStage>
      <HomeStage id="bespoke">
        <BespokeService />
      </HomeStage>
      <HomeStage id="reviews">
        <PromoteFeedBack />
      </HomeStage>
      <HomeStage id="news">
        <ArticleNews />
      </HomeStage>
      <HomeStageNav />
    </>
  );
}
