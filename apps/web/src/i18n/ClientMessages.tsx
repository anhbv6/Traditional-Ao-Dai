import type { ReactNode } from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { getMessages } from "next-intl/server";

/**
 * Chỉ gửi xuống trình duyệt những namespace mà Client Component trong nhánh này thực sự dùng.
 * Server Component đọc bản dịch ở server (getTranslations / useTranslations không "use client") nên KHÔNG cần khai báo ở đây.
 *
 * Lưu ý: provider lồng nhau THAY THẾ messages của provider cha (không gộp) → danh sách phải đủ cho cả nhánh con.
 * Namespace nhận cả đường dẫn con (vd. "ProfilePage.logoutDialog") để chỉ lấy một phần.
 * Thêm client component dùng namespace mới → bổ sung vào danh sách tương ứng trong `CLIENT_NAMESPACES`.
 */
export const CLIENT_NAMESPACES = {
  /** Khung cửa hàng: header (giỏ mini, thông báo, menu tài khoản), footer (QR, newsletter), chat */
  store: ["Common", "Errors", "Footer", "Chat", "CartPage", "NotificationsPage", "ProfilePage.logoutDialog"],
  auth: ["Common", "Auth"],
  admin: ["Common", "Errors", "AdminPage"],
  /** Trang tài khoản — thông tin cá nhân + số đo (nhãn số đo lấy từ OrdersPage.measurement) */
  profile: ["Common", "Errors", "ProfilePage", "OrdersPage.measurement"],
  /** Màn Đơn hàng của tôi (/my-orders): danh sách, chi tiết đơn, sổ địa chỉ (ProfilePage.address) */
  myOrders: ["Common", "Errors", "ProfilePage", "OrdersPage"],
  forbidden: ["Common"],
  home: ["Common", "HomePage", "Product", "ProductsPage", "WishlistPage"],
  about: ["AboutPage"],
  /** Sửa đồ & đổi trả: form yêu cầu (tra đơn, ChoiceGroup, MediaUploader cần Common), nhãn trạng thái đơn */
  afterSales: ["Common", "Errors", "AfterSalesPage", "OrdersPage.status"],
  cart: ["Common", "CartPage", "Product"],
  checkout: ["Common", "Errors", "CheckoutPage"],
  /** Tra cứu đơn (mã + SĐT), magic link, trang cảm ơn (kèm hộp tạo tài khoản dùng nút Google của Auth) */
  orders: ["Common", "Errors", "OrdersPage"],
  contact: ["Common", "ContactPage"],
  custom: ["Common", "Errors", "BespokePage"],
  faqs: ["Common", "FaqsPage"],
  /** Thư mục vải: bộ lọc, thẻ album, hộp thoại chi tiết (AppDialog cần Common) */
  fabrics: ["Common", "FabricsPage"],
  news: ["NewsPage"],
  newsDetail: ["Common", "Breadcrumbs", "NewsPage"],
  notifications: ["Common", "NotificationsPage"],
  products: ["Common", "Product", "ProductsPage", "WishlistPage"],
  productDetail: ["Common", "Breadcrumbs", "Product", "ProductsPage", "WishlistPage"],
  wishlist: ["Common", "CartPage", "Product", "ProductsPage", "WishlistPage"],
} as const satisfies Record<string, readonly string[]>;

/** Lấy các nhánh `paths` (dạng "A" hoặc "A.b.c") từ cây bản dịch, giữ nguyên cấu trúc lồng */
export function pickMessages(messages: AbstractIntlMessages, paths: readonly string[]): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};

  for (const path of paths) {
    const keys = path.split(".");
    let source: AbstractIntlMessages | string | undefined = messages;
    let target = picked;

    keys.forEach((key, index) => {
      source = typeof source === "object" ? source[key] : undefined;
      if (source === undefined) return;
      if (index === keys.length - 1) {
        target[key] = source;
      } else {
        const next = target[key];
        target[key] = typeof next === "object" ? next : {};
        target = target[key] as AbstractIntlMessages;
      }
    });
  }

  return picked;
}

interface ClientMessagesProps {
  namespaces: readonly string[];
  children: ReactNode;
}

export async function ClientMessages({ namespaces, children }: ClientMessagesProps) {
  const messages = await getMessages();
  return <NextIntlClientProvider messages={pickMessages(messages, namespaces)}>{children}</NextIntlClientProvider>;
}
