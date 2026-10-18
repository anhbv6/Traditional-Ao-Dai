"use client";

import { useState, type MouseEvent } from "react";
import { motion, MotionConfig } from "motion/react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Nút yêu thích dùng chung (thẻ sản phẩm, chi tiết sản phẩm, danh sách yêu thích…).
 *
 * - Chỉ có icon (không nền, không viền). tone="onImage" (mặc định): chưa thích = viền trắng + bóng mờ để nổi trên ảnh.
 *   tone="onSurface": đặt trên nền sáng (VD trang chi tiết) — chưa thích = màu chữ chính, không bóng. Đã thích = tô đỏ.
 * - Bấm thích: tim "nảy" (phóng → co → về), tô đỏ, toả vòng sóng + 6 hạt ra xung quanh.
 * - Bỏ thích: tim co nhẹ rồi về, chỉ còn viền.
 * - Rê chuột: tim phồng nhẹ, viền chuyển đỏ. Tắt chuyển động khi người dùng bật "giảm chuyển động".
 *
 * @example
 * <HeartToggle active={isWishlisted} onToggle={toggle} labelOn={t("removeFromWishlist")} labelOff={t("addToWishlist")} />
 */
interface HeartToggleProps {
  active: boolean;
  onToggle: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Nhãn khi đang thích (bấm để bỏ) */
  labelOn: string;
  /** Nhãn khi chưa thích (bấm để thích) */
  labelOff: string;
  /** Nền đặt nút: "onImage" (mặc định, trên ảnh) | "onSurface" (trên nền kem / trắng) */
  tone?: "onImage" | "onSurface";
  /** Cỡ icon (px) — mặc định 20 */
  iconSize?: number;
  className?: string;
}

const HEART_RED = "#E11D48";
const PARTICLES = Array.from({ length: 6 }, (_, i) => (i * Math.PI * 2) / 6 - Math.PI / 2);

export function HeartToggle({ active, onToggle, labelOn, labelOff, tone = "onImage", iconSize = 20, className }: HeartToggleProps) {
  /* Mỗi lần bấm THÍCH tăng bộ đếm → hạt / vòng sóng gắn key mới nên chạy lại hiệu ứng */
  const [burst, setBurst] = useState(0);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!active) setBurst((value) => value + 1);
    onToggle(event);
  };

  return (
    <MotionConfig reducedMotion="user">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={active}
        aria-label={active ? labelOn : labelOff}
        className={cn(
          "group/heart relative grid size-9 cursor-pointer place-items-center",
          className,
        )}
      >
        {/* Vòng sóng + hạt toả ra khi vừa bấm thích */}
        {burst > 0 ? (
          <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
            <motion.span
              className="absolute size-6 rounded-full border"
              style={{ borderColor: HEART_RED }}
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 1.9, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
            {PARTICLES.map((angle, i) => (
              <motion.span
                key={i}
                className="absolute size-1 rounded-full"
                style={{ backgroundColor: i % 2 ? "var(--accent-color)" : HEART_RED }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: Math.cos(angle) * 18, y: Math.sin(angle) * 18, scale: 0.3, opacity: 0 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </span>
        ) : null}

        <motion.span
          className="relative grid place-items-center transition-[scale] duration-500 ease-out group-hover/heart:scale-110"
          initial={false}
          animate={active ? { scale: [1, 1.35, 0.88, 1.08, 1] } : { scale: [1, 0.82, 1] }}
          transition={{ duration: active ? 0.6 : 0.35, ease: "easeOut" }}
        >
          <Heart
            size={iconSize}
            strokeWidth={1.7}
            className={cn(
              "transition-[color,fill] duration-500 ease-out",
              tone === "onImage" && "[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.45))]",
              !active && (tone === "onImage" ? "text-white" : "text-[var(--text-main)]"),
              !active && "group-hover/heart:text-[#E11D48]",
            )}
            style={{
              color: active ? HEART_RED : undefined,
              fill: active ? HEART_RED : "transparent",
            }}
          />
        </motion.span>
      </button>
    </MotionConfig>
  );
}
