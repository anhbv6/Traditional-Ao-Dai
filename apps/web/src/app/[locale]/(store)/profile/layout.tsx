import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { ProfileShell } from "@/features/profile";

/** Khung chung cho mọi trang tài khoản (/profile/*) — proxy đã chặn khi chưa đăng nhập */
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <Container as="section" width="full">
      <ProfileShell>{children}</ProfileShell>
    </Container>
  );
}
