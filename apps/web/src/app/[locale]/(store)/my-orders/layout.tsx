import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { MyOrdersShell } from "@/features/orders";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

/** Màn "Đơn hàng của tôi" (đơn hàng + sổ địa chỉ) — tách khỏi trang tài khoản; proxy đã chặn khi chưa đăng nhập */
export default function MyOrdersLayout({ children }: { children: ReactNode }) {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.myOrders}>
      <Container as="section">
        <MyOrdersShell>{children}</MyOrdersShell>
      </Container>
    </ClientMessages>
  );
}
