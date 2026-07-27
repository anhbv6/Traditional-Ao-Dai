'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DisplayProduct } from '../ProductDetailClient';

interface ProductTabsProps {
  product: DisplayProduct;
  locale: 'vi' | 'en';
}

export default function ProductTabs({ product, locale }: ProductTabsProps) {
  const t = useTranslations('Product');

  const reviewCopy = {
    title: locale === 'vi' ? 'Đánh giá của khách hàng' : 'Customer Reviews',
    addTitle: locale === 'vi' ? 'Thêm đánh giá của bạn' : 'Add your Review',
    ratingLabel: locale === 'vi' ? 'Đánh giá của bạn' : 'Your Rating',
    nameLabel: locale === 'vi' ? 'Tên' : 'Name',
    emailLabel: locale === 'vi' ? 'Email' : 'Email Address',
    reviewLabel: locale === 'vi' ? 'Nội dung đánh giá' : 'Your Review',
    namePlaceholder: locale === 'vi' ? 'Nhập tên của bạn' : 'Enter Your Name',
    emailPlaceholder: locale === 'vi' ? 'Nhập email của bạn' : 'Enter Your Email',
    reviewPlaceholder: locale === 'vi' ? 'Nhập đánh giá của bạn' : 'Enter Your Review',
    submit: locale === 'vi' ? 'Gửi đánh giá' : 'Submit',
    reviewBy: locale === 'vi' ? 'Đánh giá bởi' : 'Review by',
    postedOn: locale === 'vi' ? 'đăng ngày' : 'Posted on',
  };

  const customerReviews = [
    {
      name: 'Mark Williams',
      reviewer: 'Krist',
      date: 'June 05, 2023',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=160&auto=format&fit=crop',
      title: locale === 'vi' ? 'Sản phẩm rất đẹp, tôi rất thích' : 'Excellent Product, I Love It 😍',
      content:
        locale === 'vi'
          ? 'Chất vải mềm, màu sắc sang và đường may rất chỉn chu. Form áo lên dáng đẹp, phù hợp cho những dịp trang trọng.'
          : 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters.',
    },
    {
      name: 'Alexa Johnson',
      reviewer: 'Krist',
      date: 'June 05, 2023',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=160&auto=format&fit=crop',
      title: locale === 'vi' ? 'Con gái tôi rất hài lòng với sản phẩm này' : 'My Daughter is very much happy with this products',
      content:
        locale === 'vi'
          ? 'Mẫu áo ngoài đời đẹp hơn ảnh, mặc nhẹ và thoải mái. Gia đình tôi rất hài lòng với phần tư vấn chọn size.'
          : 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters.',
    },
  ];

  return (
    <Tabs defaultValue="description" className="flex-col mt-12 border-t border-b border-[var(--border)] py-5">
      <TabsList variant="line" className="h-auto gap-6 p-0">
        <TabsTrigger
          value="description"
          className="px-0 pb-3 text-sm font-semibold data-active:text-[var(--primary-color)] data-active:border-b-[var(--primary-color)] data-active:border-t-transparent data-active:border-x-transparent data-active:rounded-none"
        >
          {locale === 'vi' ? 'Mô tả' : 'Description'}
        </TabsTrigger>
        <TabsTrigger
          value="information"
          className="px-0 pb-3 text-sm font-semibold data-active:text-[var(--primary-color)] data-active:border-b-[var(--primary-color)] data-active:border-t-transparent data-active:border-x-transparent data-active:rounded-none"
        >
          {locale === 'vi' ? 'Thông tin bổ sung' : 'Additional Information'}
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="px-0 pb-3 text-sm font-semibold data-active:text-[var(--primary-color)] data-active:border-b-[var(--primary-color)] data-active:border-t-transparent data-active:border-x-transparent data-active:rounded-none"
        >
          {locale === 'vi' ? 'Đánh giá' : 'Reviews'}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="max-w-5xl pt-5 text-sm leading-7 text-[var(--text-main)]">
        <p>{product.longDescription}</p>
        <p className="mt-4">{product.secondaryDescription}</p>
      </TabsContent>
      <TabsContent value="information" className="max-w-5xl pt-5 text-sm leading-7 text-[var(--text-main)]">
        <p>
          {t('materialLabel')}: {product.material}. {t('sizeLabel')}: {product.sizes.join(', ')}.
        </p>
      </TabsContent>
      <TabsContent value="reviews" className="max-w-6xl pt-5 text-sm text-[var(--text-main)]">
        <div>
          <h3 className="font-[family-name:var(--font-lora)] text-xl font-bold text-[var(--text-main)]">
            {reviewCopy.title}
          </h3>

          <div className="mt-5 divide-y divide-[var(--border)]">
            {customerReviews.map((review) => (
              <article key={review.name} className="flex gap-4 py-6 first:pt-0">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                  <Image src={review.avatar} alt={review.name} fill sizes="48px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-none text-[var(--text-main)]">{review.name}</p>
                  <div className="mt-2 flex text-[var(--accent-color)]" aria-label={`${product.rating} stars`}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={17} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <h4 className="mt-3 text-base font-bold leading-6 text-[var(--text-main)]">{review.title}</h4>
                  <p className="mt-2 leading-7 text-[var(--text-main)]">{review.content}</p>
                  <p className="mt-3 text-xs text-[var(--text-light)]">
                    {reviewCopy.reviewBy} <span className="font-medium text-[var(--text-main)]">{review.reviewer}</span>{' '}
                    {reviewCopy.postedOn} <span className="font-medium text-[var(--text-main)]">{review.date}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>

          <form className="mt-7 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <h3 className="font-[family-name:var(--font-lora)] text-xl font-bold text-[var(--text-main)]">
              {reviewCopy.addTitle}
            </h3>

            <div>
              <label className="text-sm text-[var(--text-main)]">{reviewCopy.ratingLabel}</label>
              <div className="mt-3 flex flex-wrap gap-5 text-[var(--text-light)]">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    className="flex cursor-pointer gap-0.5 transition-colors hover:text-[var(--accent-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    aria-label={`${rating} stars`}
                  >
                    {Array.from({ length: rating }).map((_, index) => (
                      <Star key={index} size={18} />
                    ))}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="review-name" className="text-xs font-medium text-[var(--text-main)]">
                {reviewCopy.nameLabel}
              </label>
              <input
                id="review-name"
                type="text"
                placeholder={reviewCopy.namePlaceholder}
                className="mt-2 h-12 w-full rounded-md border border-[var(--border)] bg-[var(--bg-main)] px-4 text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-light)]/50 focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/25"
              />
            </div>

            <div>
              <label htmlFor="review-email" className="text-xs font-medium text-[var(--text-main)]">
                {reviewCopy.emailLabel}
              </label>
              <input
                id="review-email"
                type="email"
                placeholder={reviewCopy.emailPlaceholder}
                className="mt-2 h-12 w-full rounded-md border border-[var(--border)] bg-[var(--bg-main)] px-4 text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-light)]/50 focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/25"
              />
            </div>

            <div>
              <label htmlFor="review-content" className="text-xs font-medium text-[var(--text-main)]">
                {reviewCopy.reviewLabel}
              </label>
              <textarea
                id="review-content"
                placeholder={reviewCopy.reviewPlaceholder}
                rows={5}
                className="mt-2 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--bg-main)] px-4 py-3 text-sm leading-6 text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-light)]/50 focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/25"
              />
            </div>

            <Button
              type="submit"
              className="h-12 min-w-32 rounded-md bg-[var(--primary-color)] px-8 text-white hover:bg-[var(--accent-color)]"
            >
              {reviewCopy.submit}
            </Button>
          </form>
        </div>
      </TabsContent>
    </Tabs>
  );
}
