import React from "react";
import { FaqsExperience } from "@/features/faqs";
import { Container } from "@/components/ui/container";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

/** Trang cấp 1 (từ footer / trang Liên hệ) — không cần breadcrumb. Không đặt overflow-hidden để cột trái sticky được */
export default function FaqsPage() {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.faqs}>
      <Container as="section" spacing="section" className="pt-(--page-y)">
        <FaqsExperience />
      </Container>
    </ClientMessages>
  );
}
