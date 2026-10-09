import React from "react";
import { getTranslations } from "next-intl/server";
import {
  HeroBanner,
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
      <HeroBanner
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        primaryAction={t('hero.primaryAction')}
        secondaryAction={t('hero.secondaryAction')}
        imageAlt={t('hero.imageAlt')}
        note={t('hero.note')}
        caption={t('hero.caption')}
        scrollLabel={t('hero.scroll')}
        metrics={[
          { value: t('hero.metrics.designs.value'), label: t('hero.metrics.designs.label') },
          { value: t('hero.metrics.fabric.value'), label: t('hero.metrics.fabric.label') },
          { value: t('hero.metrics.fitting.value'), label: t('hero.metrics.fitting.label') },
        ]}
      />
      <HomeTrustStrip />
      <FeaturedCollections />
      <BestSellers />
      <CraftStory />
      <BespokeService />
      <PromoteFeedBack />
      <ArticleNews />
    </>
  );
}
