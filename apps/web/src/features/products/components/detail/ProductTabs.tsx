'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DisplayProduct } from '../../types/products.types';
import ProductReviews, { REVIEW_TOTAL } from './ProductReviews';

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

export default function ProductTabs({ product, locale }: ProductTabsProps) {
  const t = useTranslations('Product');
  const [tab, setTab] = useState<TabKey>('description');

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as TabKey)}
      className="mt-16 flex-col py-5 sm:mt-20"
    >
      {/* Mẫu A: tiêu đề serif lớn kiểu tạp chí, căn trái; tab đang chọn đỏ đô + gạch chân trượt */}
      <TabsList
        variant="line"
        className="flex h-auto w-full justify-start gap-5 overflow-x-auto whitespace-nowrap border-b border-[var(--border)] p-0 [scrollbar-width:none] sm:gap-10 md:overflow-x-visible [&::-webkit-scrollbar]:hidden"
      >
        {TAB_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            className="relative flex-none shrink-0 items-baseline gap-1.5 rounded-none border-0 px-0 pb-3 font-[family-name:var(--font-playfair)] text-[17px] font-medium normal-case tracking-normal text-[var(--text-light)] transition-colors duration-300 after:hidden hover:text-[var(--text-main)] data-active:text-[var(--primary-ink)] sm:text-[1.375rem]"
          >
            {t(`details.${key}`)}
            {key === 'reviews' ? (
              <span className="font-[family-name:var(--font-lora)] text-xs font-normal tabular-nums text-[var(--sale-gold)] sm:text-sm">({REVIEW_TOTAL})</span>
            ) : null}
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
      <TabsContent value="description" className="w-full pt-8 text-[15px] leading-8 text-[var(--text-main)]">
        <TabPanelMotion>
        <p>{product.longDescription}</p>
        <p className="mt-4">{product.secondaryDescription}</p>
        </TabPanelMotion>
      </TabsContent>
      <TabsContent value="information" className="w-full pt-8 text-[15px] leading-8 text-[var(--text-main)]">
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
      <TabsContent value="reviews" className="w-full pt-8 text-sm text-[var(--text-main)]">
        <TabPanelMotion>
          <ProductReviews locale={locale} />
        </TabPanelMotion>
      </TabsContent>
    </Tabs>
  );
}
