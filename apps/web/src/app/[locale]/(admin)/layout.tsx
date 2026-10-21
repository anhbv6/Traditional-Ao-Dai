import type { ReactNode } from "react";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

/**
 * Bọc khu vực quản trị bằng bản dịch AdminPage. Đặt ở cấp route group (Server Component)
 * vì `admin/layout.tsx` là Client Component nên không gọi được getMessages.
 */
export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <ClientMessages namespaces={CLIENT_NAMESPACES.admin}>{children}</ClientMessages>;
}
