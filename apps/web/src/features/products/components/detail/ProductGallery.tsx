'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Lens } from '@/components/ui/lens';

const EASE = [0.22, 1, 0.36, 1] as const;

interface ProductGalleryProps {
  galleryImages: string[];
  activeImageIndex: number;
  onActiveImageIndexChange: (index: number) => void;
  productName: string;
  imageAlt: string;
  defaultImageSrc: string;
  /** Ref tới khung ảnh chính — nguồn của hiệu ứng "bay vào giỏ" */
  imageFrameRef?: React.Ref<HTMLDivElement>;
}

/**
 * Bộ ảnh sản phẩm:
 * - Lần đầu: ảnh hé lộ như kéo tấm màn từ dưới lên.
 * - Đổi ảnh (thumbnail, mũi tên, chọn màu): ảnh mới mờ dần vào và thu từ 1.05 về 1 (cảm giác "đặt vải xuống").
 * - Khung viền thumbnail trượt theo ảnh đang chọn; kính lúp phóng to vải khi rê chuột (desktop).
 */
export default function ProductGallery({
  galleryImages,
  activeImageIndex,
  onActiveImageIndexChange,
  productName,
  imageAlt,
  defaultImageSrc,
  imageFrameRef,
}: ProductGalleryProps) {
  const t = useTranslations('Product');
  const total = galleryImages.length;
  const currentSrc = galleryImages[activeImageIndex] || defaultImageSrc;
  const go = (step: number) => onActiveImageIndexChange((activeImageIndex + step + total) % total);

  return (
    <div className="min-w-0">
      <motion.div
        ref={imageFrameRef}
        className="group relative"
        initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        transition={{ duration: 1.2, ease: EASE }}
      >
        <Lens zoomFactor={1.55} lensSize={190} lensColor="var(--primary-color)" ariaLabel={imageAlt}>
          <div className="relative aspect-[1.05/1] overflow-hidden bg-[var(--bg-secondary)]">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={currentSrc}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <Image src={currentSrc} alt={imageAlt} fill loading="eager" sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>
        </Lens>

        {total > 1 ? (
          <>
            {/* Mũi tên: luôn hiện trên cảm ứng, rê chuột mới hiện trên desktop */}
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t('gallery.previous')}
              className="absolute left-3 top-1/2 z-10 grid size-9 -translate-y-1/2 cursor-pointer place-items-center bg-white/85 text-[var(--text-main)] backdrop-blur-sm transition-[opacity,background-color,color] duration-300 hover:bg-[var(--primary-color)] hover:text-white lg:opacity-0 lg:group-hover:opacity-100"
            >
              <ChevronLeft size={18} strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t('gallery.next')}
              className="absolute right-3 top-1/2 z-10 grid size-9 -translate-y-1/2 cursor-pointer place-items-center bg-white/85 text-[var(--text-main)] backdrop-blur-sm transition-[opacity,background-color,color] duration-300 hover:bg-[var(--primary-color)] hover:text-white lg:opacity-0 lg:group-hover:opacity-100"
            >
              <ChevronRight size={18} strokeWidth={1.6} />
            </button>
            {/* Bộ đếm ảnh: số mới trượt lên */}
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-1 overflow-hidden bg-white/85 px-2.5 py-1 text-[11px] tracking-[1.5px] text-[var(--text-main)] backdrop-blur-sm">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={activeImageIndex}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="inline-block font-semibold"
                >
                  {String(activeImageIndex + 1).padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
              <span className="text-[var(--text-light)]">/ {String(total).padStart(2, '0')}</span>
            </div>
          </>
        ) : null}
      </motion.div>

      <div className="mt-4 grid grid-cols-4 gap-2.5 sm:mt-5 sm:gap-4">
        {galleryImages.map((image, index) => {
          const isActive = activeImageIndex === index;
          return (
            <motion.button
              key={`${image}-${index}`}
              type="button"
              onClick={() => onActiveImageIndexChange(index)}
              aria-label={`${productName} ${index + 1}`}
              aria-current={isActive}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.08, ease: EASE }}
              className="group/thumb relative aspect-square cursor-pointer overflow-hidden bg-[var(--bg-secondary)]"
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(max-width: 768px) 22vw, 140px"
                className={`object-cover transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/thumb:scale-105 ${
                  isActive ? 'opacity-100' : 'opacity-60 group-hover/thumb:opacity-100'
                }`}
              />
              {/* Khung viền đỏ đô trượt sang thumbnail đang chọn */}
              {isActive ? (
                <motion.span
                  layoutId="gallery-thumb-frame"
                  className="pointer-events-none absolute inset-0 border-2 border-[var(--primary-color)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                />
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
