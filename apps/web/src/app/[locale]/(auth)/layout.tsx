import type { ReactNode } from 'react';
import { ClientMessages, CLIENT_NAMESPACES } from '@/i18n/ClientMessages';

/** Khung chung các trang đăng nhập / đăng ký / quên mật khẩu — chỉ gửi bản dịch Auth xuống client */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <ClientMessages namespaces={CLIENT_NAMESPACES.auth}>{children}</ClientMessages>;
}
