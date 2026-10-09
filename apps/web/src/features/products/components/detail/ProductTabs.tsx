'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Rating, RoundedStar } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DisplayProduct } from '../../types/products.types';

interface ProductTabsProps {
  product: DisplayProduct;
  locale: 'vi' | 'en';
}

type TabKey = 'description' | 'information' | 'reviews';
const TAB_KEYS: TabKey[] = ['description', 'information', 'reviews'];
const EASE = [0.22, 1, 0.36, 1] as const;

/** Nội dung tab hiện ra nhẹ nhàng mỗi lần chuyển tab (panel được dựng lại khi kích hoạt) */
function TabPanelMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
      {children}
    </motion.div>
  );
}

const ratingStyles = {
  itemShapes: RoundedStar,
  activeFillColor: '#ff9e00',
  inactiveFillColor: '#ffeed6',
};

export default function ProductTabs({ product, locale }: ProductTabsProps) {
  const t = useTranslations('Product');
  const [rating, setRating] = useState(0);
  const [tab, setTab] = useState<TabKey>('description');

  // Translations are loaded dynamically using next-intl

  const customerReviews = [
    {
      name: 'Mark Williams',
      reviewer: 'Krist',
      date: locale === 'vi' ? '05/06/2026' : 'June 05, 2026',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=160&auto=format&fit=crop',
      title: locale === 'vi' ? 'Sản phẩm rất đẹp, tôi rất thích' : 'Beautiful piece, I love it',
      content:
        locale === 'vi'
          ? 'Chất vải mềm, màu sắc sang và đường may rất chỉn chu. Form áo lên dáng đẹp, phù hợp cho những dịp trang trọng.'
          : 'The fabric is soft, the colour feels refined and the stitching is meticulous. The silhouette is flattering and perfect for formal occasions.',
    },
    {
      name: 'Alexa Johnson',
      reviewer: 'Krist',
      date: locale === 'vi' ? '05/06/2026' : 'June 05, 2026',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=160&auto=format&fit=crop',
      title: locale === 'vi' ? 'Con gái tôi rất hài lòng với sản phẩm này' : 'My daughter is very happy with it',
      content:
        locale === 'vi'
          ? 'Mẫu áo ngoài đời đẹp hơn ảnh, mặc nhẹ và thoải mái. Gia đình tôi rất hài lòng với phần tư vấn chọn size.'
          : 'It looks even better in person, light and comfortable to wear. Our family was very pleased with the sizing advice.',
    },
  ];

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as TabKey)}
      className="mt-12 flex-col border-t border-[var(--border)] py-5"
    >
      <TabsList
        variant="line"
        className="flex h-auto w-full gap-5 overflow-x-auto whitespace-nowrap border-b border-[var(--border)] p-0 [scrollbar-width:none] sm:gap-8 md:overflow-x-visible [&::-webkit-scrollbar]:hidden"
      >
        {TAB_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            className="relative flex-none shrink-0 rounded-none border-0 px-0 pb-3 text-xs font-semibold uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors after:hidden hover:text-[var(--text-main)] data-active:text-[var(--primary-color)] sm:text-[13px]"
          >
            {t(`details.${key}`)}
            {/* Gạch chân đỏ đô trượt theo tab đang chọn */}
            {tab === key ? (
              <motion.span
                layoutId="product-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--primary-color)]"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="description" className="w-full pt-5 text-sm leading-7 text-[var(--text-main)]">
        <TabPanelMotion>
        <p>{product.longDescription}</p>
        <p className="mt-4">{product.secondaryDescription}</p>
        </TabPanelMotion>
      </TabsContent>
      <TabsContent value="information" className="w-full pt-5 text-sm leading-7 text-[var(--text-main)]">
        <TabPanelMotion>
        <div className="max-w-2xl pb-4">
          {product.colors && product.colors.length > 0 && (
            <div className="flex py-3.5">
              <span className="w-28 sm:w-36 font-bold text-[var(--text-main)] shrink-0">
                {t('details.color')}
              </span>
              <span className="text-[var(--text-light)]">
                {product.colors.map((c) => c.name).join(', ')}
              </span>
            </div>
          )}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex py-3.5">
              <span className="w-28 sm:w-36 font-bold text-[var(--text-main)] shrink-0">
                {t('details.size')}
              </span>
              <span className="text-[var(--text-light)]">
                {product.sizes.join(', ')}
              </span>
            </div>
          )}
          {product.material && (
            <div className="flex py-3.5">
              <span className="w-28 sm:w-36 font-bold text-[var(--text-main)] shrink-0">
                {t('materialLabel')}
              </span>
              <span className="text-[var(--text-light)]">{product.material}</span>
            </div>
          )}
        </div>
        </TabPanelMotion>
      </TabsContent>
      <TabsContent value="reviews" className="w-full pt-5 text-sm text-[var(--text-main)]">
        <TabPanelMotion>
        <div>
          <h3 className="font-[family-name:var(--font-lora)] text-xl font-bold text-[var(--text-main)]">
            {t('details.customerReviewsTitle')}
          </h3>

          <div className="mt-5">
            {customerReviews.map((review) => (
              <article key={review.name} className="flex gap-4 py-6 first:pt-0">
                <div className="relative size-12 shrink-0 overflow-hidden bg-[var(--bg-secondary)]">
                  <Image src={review.avatar} alt={review.name} fill sizes="48px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-none text-[var(--text-main)]">{review.name}</p>
                  <div className="mt-2">
                    <Rating
                      style={{ maxWidth: 85 }}
                      value={5}
                      itemStyles={ratingStyles}
                      readOnly
                    />
                  </div>
                  <h4 className="mt-3 text-base font-bold leading-6 text-[var(--text-main)]">{review.title}</h4>
                  <p className="mt-2 leading-7 text-[var(--text-main)]">{review.content}</p>
                  <p className="mt-3 text-xs text-[var(--text-light)]">
                    {review.date}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <form className="mt-7 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <h3 className="font-[family-name:var(--font-lora)] text-xl font-bold text-[var(--text-main)]">
              {t('details.addReview')}
            </h3>

            <div>
              <label className="text-sm text-[var(--text-main)]">{t('details.yourRating')}</label>
              <div className="mt-3">
                <Rating
                  style={{ maxWidth: 130 }}
                  value={rating}
                  onChange={setRating}
                  itemStyles={ratingStyles}
                  isRequired
                />
              </div>
            </div>

            <div>
              <label htmlFor="review-name" className="text-xs font-medium text-[var(--text-main)]">
                {t('details.nameLabel')}
              </label>
              <input
                id="review-name"
                type="text"
                placeholder={t('details.namePlaceholder')}
                className="mt-2 h-12 w-full border border-[var(--border)] bg-[var(--bg-main)] px-4 text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-light)]/50 focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/25"
              />
            </div>

            <div>
              <label htmlFor="review-email" className="text-xs font-medium text-[var(--text-main)]">
                {t('details.emailLabel')}
              </label>
              <input
                id="review-email"
                type="email"
                placeholder={t('details.emailPlaceholder')}
                className="mt-2 h-12 w-full border border-[var(--border)] bg-[var(--bg-main)] px-4 text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-light)]/50 focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/25"
              />
            </div>

            <div>
              <label htmlFor="review-content" className="text-xs font-medium text-[var(--text-main)]">
                {t('details.reviewLabel')}
              </label>
              <textarea
                id="review-content"
                placeholder={t('details.reviewPlaceholder')}
                rows={5}
                className="mt-2 w-full resize-y border border-[var(--border)] bg-[var(--bg-main)] px-4 py-3 text-sm leading-6 text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-light)]/50 focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/25"
              />
            </div>

            <Button
              type="submit"
              className="h-12 min-w-32 bg-[var(--primary-color)] px-8 text-white hover:bg-[var(--accent-color)]"
            >
              {t('details.submitReview')}
            </Button>
          </form>
        </div>
        </TabPanelMotion>
      </TabsContent>
    </Tabs>
  );
}
