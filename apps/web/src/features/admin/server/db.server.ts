import { prisma } from "@repo/db";

// Khu vực admin gọi Prisma trực tiếp từ Next.js -> server Next phải có DATABASE_URL (apps/web/.env).
// Thiếu biến này mọi truy vấn admin đều thất bại với thông báo khó hiểu, nên cảnh báo ngay khi nạp module.
if (!process.env.DATABASE_URL) {
  console.error(
    "[admin/db] Thiếu biến môi trường DATABASE_URL trong apps/web/.env — khu vực admin không thể truy cập cơ sở dữ liệu."
  );
}

export { prisma };
export default prisma;
