import { notFound } from 'next/navigation';

/**
 * Bắt mọi URL không khớp route nào trong /[locale]/… → chuyển sang `not-found.tsx` của storefront
 * (có header / footer + đã dịch), thay vì trang 404 trơn mặc định.
 */
export default function CatchAllNotFound() {
  notFound();
}
