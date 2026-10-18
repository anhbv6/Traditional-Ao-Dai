'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Chuyển động zoom: khung chọn và ảnh phóng to "đuổi theo" con trỏ bằng transition left/top (mỗi lần rê chuột
 * transition khởi động lại từ vị trí đang chạy → trượt êm, hơi trễ); bảng zoom hiện / ẩn chậm.
 */
const FOLLOW_CLASS = 'transition-[left,top] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';
const FADE_CLASS = 'transition-[opacity,visibility] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';
/** Khung chọn: vừa đuổi theo con trỏ vừa mờ dần — gộp chung một transition */
const LENS_CLASS = 'transition-[left,top,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';

/** Độ phóng của bảng zoom — khung chọn trên ảnh chiếm 1/ZOOM chiều rộng / cao của ảnh */
const ZOOM = 2.5;
const LENS = 1 / ZOOM;

/** Vị trí góc trên-trái của khung chọn, tính theo tỉ lệ 0..1 của khung ảnh */
type ZoomPoint = { x: number; y: number };

const toPercent = (value: number) => `${value * 100}%`;

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
 * - Đổi ảnh (thumbnail, chọn màu): ảnh mới mờ dần vào và thu từ 1.05 về 1 (cảm giác "đặt vải xuống").
 * - Khung viền thumbnail trượt theo ảnh đang chọn.
 * - Zoom (desktop, chuột): rê vào ảnh hiện khung chọn; bảng phóng to nằm BÊN NGOÀI bên phải (đè lên cột thông tin)
 *   để xem rõ đường thêu / chất vải mà không che ảnh gốc.
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
  const currentSrc = galleryImages[activeImageIndex] || defaultImageSrc;
  // Vị trí giữ lại sau khi rời chuột để khung chọn / bảng zoom mờ dần tại chỗ (không nhảy về góc)
  const [zoomPoint, setZoomPoint] = useState<ZoomPoint>({ x: 0.3, y: 0.3 });
  const [isZooming, setIsZooming] = useState(false);

  /** Chỉ zoom bằng chuột trên desktop */
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (event.pointerType !== 'mouse' || !isDesktop) {
      setIsZooming(false);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const clamp = (value: number) => Math.min(Math.max(value - LENS / 2, 0), 1 - LENS);
    setZoomPoint({
      x: clamp((event.clientX - rect.left) / rect.width),
      y: clamp((event.clientY - rect.top) / rect.height),
    });
    setIsZooming(true);
  };

  return (
    <div className="min-w-0">
      {/* Lớp ngoài KHÔNG cắt: clip-path của hiệu ứng mở màn sẽ cắt mất bảng zoom nằm bên ngoài khung ảnh */}
      <div className="relative z-20">
        <motion.div
          ref={imageFrameRef}
          className="group relative"
          initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 1.2, ease: EASE }}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setIsZooming(false)}
        >
          <div className={`relative aspect-[1.05/1] overflow-hidden bg-[var(--bg-secondary)] ${isZooming ? 'cursor-crosshair' : ''}`}>
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

            {/* Khung chọn vùng đang phóng to — trượt êm theo con trỏ, mờ dần khi vào / ra */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute z-[5] hidden border border-[var(--primary-color)]/50 bg-white/25 lg:block ${LENS_CLASS} ${
                isZooming ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ left: toPercent(zoomPoint.x), top: toPercent(zoomPoint.y), width: toPercent(LENS), height: toPercent(LENS) }}
            />
          </div>

        </motion.div>

        {/* Bảng phóng to bên ngoài, bên phải ảnh — cùng tỉ lệ khung ảnh nên vùng hiển thị khớp đúng khung chọn.
            Luôn gắn sẵn trên desktop (chỉ ẩn bằng opacity) để ảnh độ phân giải cao tải trước, rê vào là thấy ngay. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-[calc(100%+1.5rem)] top-0 z-40 hidden aspect-[1.05/1] w-[78%] overflow-hidden border-[3px] border-[var(--bg-card)] bg-[var(--bg-card)] outline outline-1 outline-[var(--primary-color)]/35 shadow-[0_24px_60px_-24px_rgba(42,10,18,0.35)] lg:block ${FADE_CLASS} ${
            isZooming ? 'visible opacity-100' : 'invisible opacity-0'
          }`}
        >
          <div
            className={`absolute ${FOLLOW_CLASS}`}
            style={{
              width: toPercent(ZOOM),
              height: toPercent(ZOOM),
              left: toPercent(-zoomPoint.x * ZOOM),
              top: toPercent(-zoomPoint.y * ZOOM),
            }}
          >
            <Image src={currentSrc} alt="" fill sizes="1600px" quality={90} loading="lazy" className="object-cover" />
          </div>
        </div>
      </div>

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
