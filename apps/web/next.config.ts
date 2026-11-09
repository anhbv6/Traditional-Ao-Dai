import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Địa chỉ nội bộ của Backend Express (chỉ server Next.js dùng, không lộ ra trình duyệt).
 * Trình duyệt luôn gọi `/api/*` trên chính domain của web -> Next.js chuyển tiếp sang Express (cùng origin):
 * cookie httpOnly do API đặt gắn đúng domain web, không cần CORS.
 */
const API_INTERNAL_URL = (process.env.API_INTERNAL_URL || "http://127.0.0.1:3001").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // devIndicators: false,
  allowedDevOrigins: ["192.168.1.98"],
  // Các package workspace export thẳng mã nguồn TypeScript
  transpilePackages: ["@repo/shared", "@repo/db"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
      },
      {
        // Ảnh upload qua Backend (Cloudinary)
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        // QR chuyển khoản động (VietQR) — ảnh đã chứa số tiền + nội dung, hiển thị unoptimized để giữ nét khi quét
        protocol: "https",
        hostname: "img.vietqr.io",
      },
    ],
  },
  // Đơn hàng + sổ địa chỉ đã tách khỏi trang tài khoản sang /my-orders — giữ link cũ (email, bookmark) không chết
  async redirects() {
    return [
      { source: "/:locale(vi|en)/profile/orders/:path*", destination: "/:locale/my-orders/:path*", permanent: false },
      { source: "/:locale(vi|en)/profile/addresses", destination: "/:locale/my-orders/addresses", permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_INTERNAL_URL}/api/:path*`,
      },
    ];
  },
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
};

export default withNextIntl(nextConfig);
