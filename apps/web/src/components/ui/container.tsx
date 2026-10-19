import React, { type ComponentPropsWithoutRef, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * Khoảng cách dọc của khung — giá trị lấy từ token ở globals.css (mục 1b):
 * - `page`    : trang nội dung (giỏ hàng, tin tức, chi tiết sản phẩm…) — `--page-y`.
 * - `section` : khối kể chuyện ở trang chủ / giới thiệu / liên hệ — `--section-y`.
 * - `none`    : không đệm dọc, tự truyền `py-*` / `pt-*` qua className.
 */
const SPACING_CLASSES = {
  none: "",
  page: "py-(--page-y)",
  section: "py-(--section-y)",
} as const;

/**
 * Bề rộng tối đa — `default` theo `--page-max-width`, `narrow` cho bài viết / nội dung đọc dài,
 * `full` tràn hết màn hình (vẫn giữ lề `--page-gutter`) cho trang dạng bảng làm việc (vd. Yêu thích + giỏ kéo thả).
 */
const WIDTH_CLASSES = {
  default: "max-w-(--page-max-width)",
  narrow: "max-w-6xl",
  full: "max-w-none",
} as const;

export type ContainerSpacing = keyof typeof SPACING_CLASSES;
export type ContainerWidth = keyof typeof WIDTH_CLASSES;

interface ContainerProps<T extends ElementType = "div"> {
  as?: T;
  children: React.ReactNode;
  className?: string;
  spacing?: ContainerSpacing;
  width?: ContainerWidth;
}

interface ContainerClassOptions {
  spacing?: ContainerSpacing;
  width?: ContainerWidth;
  className?: string;
}

/**
 * Class của khung nội dung — dùng khi phần tử không thể thay bằng `<Container>`
 * (motion.div, Reveal, phần tử cần `ref`…). Mặc định không đệm dọc.
 */
export function containerClassName({ spacing = "none", width = "default", className }: ContainerClassOptions = {}) {
  return cn("mx-auto w-full px-(--page-gutter)", WIDTH_CLASSES[width], SPACING_CLASSES[spacing], className);
}

/**
 * Khung nội dung chung của storefront: căn giữa, giới hạn bề rộng và lề trái/phải responsive.
 * Mọi section cần thẳng lề với header/footer đều dùng component này thay vì tự viết `max-w-[1440px] px-*`.
 * Nền section (màu, ảnh) đặt ở thẻ bọc ngoài, Container chỉ lo bố cục bên trong.
 */
export function Container<T extends ElementType = "div">({
  as,
  children,
  className,
  spacing = "page",
  width = "default",
  ...props
}: ContainerProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof ContainerProps<T>>) {
  const Component = as || "div";
  return (
    <Component
      className={containerClassName({ spacing, width, className })}
      {...props}
    >
      {children}
    </Component>
  );
}
