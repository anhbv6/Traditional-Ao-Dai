"use client";

import React, { useRef } from "react";
import { motion } from "motion/react";
import { formatVnd, type Locale } from "@repo/shared";
import { ProductCard } from "@/features/products";
import { type WishlistItem } from "../types/wishlist.types";

const EASE = [0.22, 1, 0.36, 1] as const;

interface DraggableWishlistCardProps {
  item: WishlistItem;
  index: number;
  locale: Locale;
  /** Bật kéo thả (chỉ desktop có chuột — màn cảm ứng kéo sẽ chặn cuộn trang) */
  canDrag: boolean;
  /** Ref vùng thả (khung giỏ hàng) để kiểm tra con trỏ có nằm trên đó không */
  dropRef: React.RefObject<HTMLElement | null>;
  onDragChange: (dragging: boolean) => void;
  onOverChange: (over: boolean) => void;
  onDropToCart: (item: WishlistItem) => void;
  /** AnimatePresence `popLayout` cần ref tới phần tử gốc để đo vị trí khi thẻ rời đi */
  ref?: React.Ref<HTMLDivElement>;
}

/** Con trỏ (toạ độ màn hình) có nằm trong khung phần tử không */
const isPointInside = (element: HTMLElement | null, x: number, y: number) => {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
};

/**
 * Thẻ yêu thích = ProductCard dùng chung (bấm tim để bỏ khỏi danh sách) + kéo thả sang khung giỏ hàng.
 * - Kéo: thẻ thu nhỏ, nghiêng nhẹ, nổi lên trên; thả trong khung giỏ -> thêm vào giỏ; thả ngoài -> trượt về chỗ cũ.
 * - Sau khi kéo, chặn cú "click" sinh ra lúc nhả chuột để không bị chuyển sang trang chi tiết.
 * - Chặn kéo-thả gốc của trình duyệt (ảnh / link) để không tranh với thao tác kéo của motion.
 */
export function DraggableWishlistCard({
  item,
  index,
  locale,
  canDrag,
  dropRef,
  onDragChange,
  onOverChange,
  onDropToCart,
  ref,
}: DraggableWishlistCardProps) {
  const justDraggedRef = useRef(false);
  const overRef = useRef(false);
  const delay = Math.min(index, 7) * 0.06;

  const setOver = (over: boolean) => {
    if (overRef.current === over) return;
    overRef.current = over;
    onOverChange(over);
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.3, ease: EASE } }}
      transition={{
        layout: { type: "spring", stiffness: 280, damping: 34 },
        opacity: { duration: 0.5, delay },
        y: { duration: 0.7, delay, ease: EASE },
      }}
      // Kéo-thả gốc của trình duyệt (kéo ảnh / link) -> tắt, nhường cho motion
      onDragStartCapture={(event: React.DragEvent) => event.preventDefault()}
    >
      <motion.div
        drag={canDrag}
        dragSnapToOrigin
        dragElastic={1}
        dragMomentum={false}
        whileDrag={{ scale: 0.55, rotate: -3, zIndex: 50, cursor: "grabbing", boxShadow: "0 24px 50px -20px rgba(42,10,18,0.45)" }}
        onDragStart={() => {
          justDraggedRef.current = true;
          onDragChange(true);
        }}
        onDrag={(_, info) => setOver(isPointInside(dropRef.current, info.point.x - window.scrollX, info.point.y - window.scrollY))}
        onDragEnd={(_, info) => {
          if (isPointInside(dropRef.current, info.point.x - window.scrollX, info.point.y - window.scrollY)) onDropToCart(item);
          setOver(false);
          onDragChange(false);
          // Cú click sinh ra ngay sau khi nhả chuột vẫn bị chặn; sau đó bấm bình thường lại được
          window.setTimeout(() => {
            justDraggedRef.current = false;
          }, 0);
        }}
        onClickCapture={(event) => {
          if (!justDraggedRef.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        className={canDrag ? "relative cursor-grab bg-[var(--bg-main)]" : "relative"}
      >
        <ProductCard
          imageSrc={item.image}
          imageAlt={item.name}
          name={item.name}
          description={item.subline}
          price={formatVnd(item.price, locale)}
          priceValue={item.price}
          originalPrice={item.originalPrice ? formatVnd(item.originalPrice, locale) : undefined}
          originalPriceValue={item.originalPrice}
          slug={item.slug}
          purchaseType={item.purchaseType}
          productHref={`/products/${item.slug}`}
        />
      </motion.div>
    </motion.div>
  );
}
