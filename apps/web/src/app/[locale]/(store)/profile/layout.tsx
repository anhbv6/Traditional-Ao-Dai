import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { ProfileShell } from "@/features/profile";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

/** Khung chung cho mọi trang tài khoản (/profile/*) — proxy đã chặn khi chưa đăng nhập */
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.profile}>
      <Container as="section" width="full">
        <ProfileShell>{children}</ProfileShell>
      </Container>
    </ClientMessages>
  );
}
