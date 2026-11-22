'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Chuyển động zoom: vị trí con trỏ lưu bằng motion value (KHÔNG setState mỗi lần rê chuột → không re-render),
 * khung chọn và ảnh phóng to đuổi theo bằng spring trên `transform` (chạy GPU, không tính lại layout).
 * Bảng zoom / khung chọn chỉ hiện – ẩn bằng opacity.
 */
/** Bảng zoom hiện / ẩn: mờ dần + phóng nhẹ từ mép trái (phía ảnh gốc), cùng đường cong ease-out mềm */
const FADE_CLASS =
  'origin-left transition-[opacity,scale,visibility] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';
const LENS_FADE_CLASS = 'transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';
/** Spring đuổi theo con trỏ: trượt mượt, hơi trễ; giảm chấn trên mức tới hạn để không nảy / rung */
const FOLLOW_SPRING = { stiffness: 110, damping: 20, mass: 0.6 };

/** Độ phóng của bảng zoom — khung chọn trên ảnh chiếm 1/ZOOM chiều rộng / cao của ảnh */
const ZOOM = 2.5;
/** Bề rộng bảng zoom so với ảnh gốc — cùng tỉ lệ và kích thước với ảnh gốc để 2 khung cân xứng chuẩn xác */
const ZOOM_PANEL_CLASS = 'w-full';
const LENS = 1 / ZOOM;

const toPercent = (value: number) => `${value * 100}%`;
/** Vị trí góc trên-trái của khung chọn (tỉ lệ 0..1 của khung ảnh), giữ khung chọn nằm trọn trong ảnh */
const clampLens = (value: number) => Math.min(Math.max(value - LENS / 2, 0), 1 - LENS);

interface ProductGalleryProps {
  galleryImages: string[];
  activeImageIndex: number;
  onActiveImageIndexChange: (index: number) => void;
  productName: string;
  imageAlt: string;
  defaultImageSrc: string;
  /** Ref tới khung ảnh chính — nguồn của hiệu ứng "bay vào giỏ" */
  imageFrameRef?: React.Ref<HTMLDivElement>;
  /** Ghim khi cuộn trang chi tiết (mặc định: true, modal preview: false) */
  isSticky?: boolean;
  /** Bật khung phóng to khi rê chuột desktop (mặc định: true, modal preview: false) */
  enableZoom?: boolean;
  /** Thu nhỏ nhẹ khoảng cách và layout khi nằm trong modal xem trước */
  compact?: boolean;
  className?: string;
}

/**
 * Bộ ảnh sản phẩm:
 * - Lần đầu: ảnh hé lộ như kéo tấm màn từ dưới lên.
 * - Đổi ảnh (thumbnail, chọn màu): ảnh mới mờ dần vào và thu từ 1.05 về 1 (cảm giác "đặt vải xuống").
 * - Khung viền thumbnail trượt theo ảnh đang chọn.
 * - Zoom (desktop, chuột): rê vào ảnh hiện khung chọn; bảng phóng to nằm BÊN NGOÀI bên phải (đè lên cột thông tin)
 *   để xem rõ đường thêu / chất vải mà không che ảnh gốc.
 * - Desktop: cả cụm ảnh ghim khi cuộn (sticky) cho tới hết cột bên phải (thông tin / đánh giá). `z-30` để bảng zoom
 *   (tràn sang cột phải) nằm trên avatar / ảnh đánh giá — sticky tạo lớp xếp chồng riêng nên z bên trong không đủ;
 *   bề rộng giới hạn theo chiều cao màn hình để ảnh + hàng thumbnail luôn vừa khung nhìn.
 */
export default function ProductGallery({
  galleryImages,
  activeImageIndex,
  onActiveImageIndexChange,
  productName,
  imageAlt,
  defaultImageSrc,
  imageFrameRef,
  isSticky = true,
  enableZoom = true,
  compact = false,
  className,
}: ProductGalleryProps) {
  const currentSrc = galleryImages[activeImageIndex] || defaultImageSrc;
  const reduceMotion = useReducedMotion();
  // Chỉ bật / tắt zoom mới re-render; vị trí con trỏ đi qua motion value
  const [isZooming, setIsZooming] = useState(false);
  // Khung ảnh đo một lần khi rê vào (tránh getBoundingClientRect + matchMedia ở mọi pointermove)
  const frameRectRef = useRef<DOMRect | null>(null);

  // Vị trí giữ lại sau khi rời chuột để khung chọn / bảng zoom mờ dần tại chỗ (không nhảy về góc)
  const pointX = useMotionValue(0.3);
  const pointY = useMotionValue(0.3);
  const springX = useSpring(pointX, FOLLOW_SPRING);
  const springY = useSpring(pointY, FOLLOW_SPRING);
  const followX = reduceMotion ? pointX : springX;
  const followY = reduceMotion ? pointY : springY;
  // Khung chọn rộng LENS khung ảnh → dịch x khung ảnh = x / LENS = x * ZOOM lần bề rộng của chính nó
  const lensX = useTransform(followX, (v) => toPercent(v * ZOOM));
  const lensY = useTransform(followY, (v) => toPercent(v * ZOOM));
  // Ảnh phóng rộng ZOOM bảng zoom → dịch -x * ZOOM bảng = -x lần bề rộng của chính nó
  const zoomX = useTransform(followX, (v) => toPercent(-v));
  const zoomY = useTransform(followY, (v) => toPercent(-v));

  const updatePoint = (event: React.PointerEvent<HTMLDivElement>, rect: DOMRect) => {
    pointX.set(clampLens((event.clientX - rect.left) / rect.width));
    pointY.set(clampLens((event.clientY - rect.top) / rect.height));
  };

  /** Chỉ zoom bằng chuột trên desktop — rê vào: đo khung, đặt khung chọn ngay tại con trỏ (không trượt từ chỗ cũ) */
  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(min-width: 768px)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    frameRectRef.current = rect;
    updatePoint(event, rect);
    springX.jump(pointX.get());
    springY.jump(pointY.get());
    setIsZooming(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!frameRectRef.current) {
      handlePointerEnter(event);
      return;
    }
    updatePoint(event, frameRectRef.current);
  };

  const handlePointerLeave = () => {
    frameRectRef.current = null;
    setIsZooming(false);
  };

  return (
    <div
      className={cn(
        "min-w-0 w-full",
        isSticky && "lg:sticky lg:top-28 lg:z-30 lg:max-w-[calc((100vh-9rem)/1.2)] lg:self-start",
        className
      )}
    >
      {/* Lớp ngoài KHÔNG cắt: clip-path của hiệu ứng mở màn sẽ cắt mất bảng zoom nằm bên ngoài khung ảnh */}
      <div className="relative z-20">
        <motion.div
          ref={imageFrameRef}
          className="group relative"
          initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 1.2, ease: EASE }}
          onPointerEnter={enableZoom ? handlePointerEnter : undefined}
          onPointerMove={enableZoom ? handlePointerMove : undefined}
          onPointerLeave={enableZoom ? handlePointerLeave : undefined}
        >
          <div className={`relative aspect-[1.05/1] overflow-hidden bg-[var(--bg-secondary)] ${enableZoom && isZooming ? 'cursor-crosshair' : ''}`}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={currentSrc}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <Image
                  src={currentSrc}
                  alt={imageAlt}
                  fill
                  loading="eager"
                  sizes="(max-width: 1024px) 100vw, 44vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* Khung chọn vùng đang phóng to — trượt êm theo con trỏ, mờ dần khi vào / ra */}
            {enableZoom && (
              <motion.div
                aria-hidden="true"
                className={`pointer-events-none absolute left-0 top-0 z-[5] hidden border border-[var(--primary-color)]/50 bg-white/25 will-change-transform md:block ${LENS_FADE_CLASS} ${
                  isZooming ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ x: lensX, y: lensY, width: toPercent(LENS), height: toPercent(LENS) }}
              />
            )}
          </div>

        </motion.div>

        {/* Bảng phóng to bên ngoài, bên phải ảnh — cùng tỉ lệ khung ảnh nên vùng hiển thị khớp đúng khung chọn.
            Luôn gắn sẵn trên desktop (chỉ ẩn bằng opacity) để ảnh độ phân giải cao tải trước, rê vào là thấy ngay. */}
        {enableZoom && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute left-[calc(100%+1.5rem)] top-0 z-40 hidden aspect-[1.05/1] ${ZOOM_PANEL_CLASS} overflow-hidden border-[3px] border-[var(--bg-card)] bg-[var(--bg-card)] outline outline-1 outline-[var(--primary-color)]/35 shadow-[0_24px_60px_-24px_rgba(42,10,18,0.35)] md:block ${FADE_CLASS} ${
              isZooming ? 'visible scale-100 opacity-100' : 'invisible scale-[0.96] opacity-0'
            }`}
          >
            <motion.div
              className="absolute left-0 top-0 will-change-transform"
              style={{ x: zoomX, y: zoomY, width: toPercent(ZOOM), height: toPercent(ZOOM) }}
            >
              <Image src={currentSrc} alt="" fill sizes="1600px" quality={90} loading="lazy" className="object-cover" />
            </motion.div>
          </div>
        )}
      </div>

      <div className={cn("grid grid-cols-4 gap-2.5", compact ? "mt-3 gap-2" : "mt-4 sm:mt-5 sm:gap-4")}>
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
                  layoutId={compact ? "preview-gallery-thumb-frame" : "gallery-thumb-frame"}
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
