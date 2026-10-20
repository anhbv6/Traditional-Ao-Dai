'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductReviews, { REVIEW_TOTAL } from './ProductReviews';

export type ProductSideTabKey = 'info' | 'reviews';
const TAB_KEYS: ProductSideTabKey[] = ['info', 'reviews'];
const EASE = [0.22, 1, 0.36, 1] as const;

interface ProductSideTabsProps {
  value: ProductSideTabKey;
  onValueChange: (value: ProductSideTabKey) => void;
  locale: 'vi' | 'en';
  /** Nội dung tab "Thông tin sản phẩm" (ProductInfo: tên, giá, màu, size, nút mua...) */
  infoPanel: React.ReactNode;
}

/**
 * Cột cạnh ảnh sản phẩm chia 2 tab: "Thông tin sản phẩm" và "Đánh giá".
 * Tab thông tin luôn được giữ trong DOM (`keepMounted`) để không mất trạng thái đang chọn
 * và để thanh mua nhanh trên mobile vẫn theo dõi được hàng nút mua.
 */
export default function ProductSideTabs({ value, onValueChange, locale, infoPanel }: ProductSideTabsProps) {
  const t = useTranslations('Product.details');

  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as ProductSideTabKey)} className="min-w-0 flex-col gap-0">
      <TabsList
        variant="line"
        className="flex h-auto w-full justify-start gap-6 overflow-x-auto whitespace-nowrap border-b border-[var(--border)] p-0 [scrollbar-width:none] sm:gap-10 [&::-webkit-scrollbar]:hidden"
      >
        {TAB_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            className="relative flex-none shrink-0 items-baseline gap-1.5 rounded-none border-0 px-0 pb-3 font-[family-name:var(--font-playfair)] text-base font-medium normal-case tracking-normal text-[var(--text-light)] transition-colors duration-300 after:hidden hover:text-[var(--text-main)] data-active:text-[var(--primary-ink)] sm:text-lg"
          >
            {t(key === 'info' ? 'productInfo' : 'reviews')}
            {key === 'reviews' ? (
              <span className="font-[family-name:var(--font-lora)] text-xs font-normal tabular-nums text-[var(--sale-gold)]">({REVIEW_TOTAL})</span>
            ) : null}
            {/* Gạch chân đỏ đô trượt theo tab đang chọn */}
            {value === key ? (
              <motion.span
                layoutId="product-side-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--primary-color)]"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="info" keepMounted className="w-full pt-6 data-[hidden]:hidden">
        {infoPanel}
      </TabsContent>
      <TabsContent value="reviews" className="w-full pt-6 text-[0.9375rem] text-[var(--text-main)]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
          <ProductReviews locale={locale} />
        </motion.div>
      </TabsContent>
    </Tabs>
  );
}
