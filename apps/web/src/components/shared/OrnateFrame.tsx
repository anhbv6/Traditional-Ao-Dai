"use client";

import { useRef, type ReactNode } from "react";
import { motion, MotionConfig, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Khung trang trí kiểu "viền gấm" bọc nội dung bất kỳ — dùng chung toàn storefront
 * (thẻ điểm đánh giá, nhãn thanh tiến trình, chú thích ảnh, thẻ ưu đãi…).
 *
 * Trang trí: nền thẻ + bóng đỏ đô mờ, khung trong mảnh vàng kim (cạnh trên sáng dần vào giữa), 4 hạt thoi ở góc.
 * Hiệu ứng tuỳ chọn (đều tắt khi người dùng bật "giảm chuyển động"):
 *  - `shimmer`: vệt sáng quét chéo — "loop" lặp theo chu kỳ | "hover" quét một lần mỗi khi rê chuột | "none".
 *  - `reveal`: hiện mờ dần + trồi lên khi cuộn tới.
 *  - `float`: bồng bềnh lên xuống rất nhẹ.
 *  - `hoverLift`: rê chuột thì nhấc lên.
 *
 * Định vị (absolute, margin…) truyền qua `className` — lớp ngoài cùng không bị animate nên không xung đột transform.
 * Khoảng đệm nội dung truyền qua `contentClassName`.
 *
 * @example
 * <OrnateFrame shimmer="loop" reveal float className="absolute -right-8 bottom-12" contentClassName="px-7 py-6">
 *   ...nội dung...
 * </OrnateFrame>
 */
interface OrnateFrameProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** `md` (mặc định) cho thẻ lớn | `sm` cho nhãn / chip nhỏ (khung trong + hạt thoi sát hơn) */
  size?: "sm" | "md";
  shimmer?: "loop" | "hover" | "none";
  reveal?: boolean;
  float?: boolean;
  hoverLift?: boolean;
  role?: string;
  "aria-label"?: string;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const SIZE_STYLES = {
  md: {
    inset: "inset-1.5",
    topLine: "left-1.5 right-1.5 top-1.5",
    corners: ["left-1.5 top-1.5", "right-1.5 top-1.5", "bottom-1.5 left-1.5", "bottom-1.5 right-1.5"],
    diamond: "-m-[2.5px] size-[5px]",
    shadow: "shadow-[0_24px_50px_-24px_rgba(128,0,32,0.5)]",
  },
  /* Nhãn nhỏ: khung trong lùi vào 5px, hạt thoi chỉ 3px (xoay 45° ≈ 4.2px) để nằm gọn trong mép thẻ, không chạm / bị cắt */
  sm: {
    inset: "inset-[5px]",
    topLine: "left-[5px] right-[5px] top-[5px]",
    corners: ["left-[5px] top-[5px]", "right-[5px] top-[5px]", "bottom-[5px] left-[5px]", "bottom-[5px] right-[5px]"],
    diamond: "-m-[1.5px] size-[3px]",
    shadow: "shadow-[0_10px_26px_-14px_rgba(128,0,32,0.5)]",
  },
} as const;

export function OrnateFrame({
  children,
  className,
  contentClassName,
  size = "md",
  shimmer = "none",
  reveal = false,
  float = false,
  hoverLift = false,
  role,
  "aria-label": ariaLabel,
}: OrnateFrameProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const styles = SIZE_STYLES[size];

  return (
    <div ref={ref} className={className}>
      <MotionConfig reducedMotion="user">
        <motion.div
          animate={float && !reduceMotion ? { y: [0, -5, 0] } : undefined}
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        >
          <motion.div
            role={role}
            aria-label={ariaLabel}
            initial={reveal ? { opacity: 0, y: 14 } : false}
            animate={reveal && inView ? { opacity: 1, y: 0 } : undefined}
            whileHover={hoverLift ? { y: size === "sm" ? -2 : -4 } : undefined}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className={cn("group/frame relative overflow-hidden bg-[var(--bg-card)]", styles.shadow)}
          >
            {/* Khung trong mảnh + hạt thoi ở 4 góc — gợi đường viền gấm */}
            <span aria-hidden="true" className={cn("pointer-events-none absolute border border-[var(--accent-color)]/35", styles.inset)} />
            {/* Điểm sáng vàng ở giữa cạnh trên — nằm TRÙNG cạnh trên khung trong (không thành đường riêng tràn ra ngoài khung) */}
            <span
              aria-hidden="true"
              className={cn("absolute h-px bg-gradient-to-r from-transparent via-[var(--accent-color)] to-transparent", styles.topLine)}
            />
            {styles.corners.map((position) => (
              <span
                key={position}
                aria-hidden="true"
                className={cn("absolute rotate-45 bg-[var(--accent-color)]", styles.diamond, position)}
              />
            ))}

            {/* Vệt sáng quét chéo */}
            {shimmer === "loop" ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-reduce:hidden"
                style={{ animation: "shimmer-sweep 6s ease-in-out 1.8s infinite", transform: "translateX(-160%) skewX(-20deg)" }}
              />
            ) : null}
            {shimmer === "hover" ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent group-hover/frame:animate-[shimmer-once_0.9s_ease-out_forwards] motion-reduce:hidden"
                style={{ transform: "translateX(-160%) skewX(-20deg)" }}
              />
            ) : null}

            <div className={cn("relative", contentClassName)}>{children}</div>
          </motion.div>
        </motion.div>
      </MotionConfig>
    </div>
  );
}
