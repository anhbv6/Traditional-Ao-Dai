import React from "react";
import { FaqsExperience } from "@/features/faqs";
import { Container } from "@/components/ui/container";

/** Trang cấp 1 (từ footer / trang Liên hệ) — không cần breadcrumb. Không đặt overflow-hidden để cột trái sticky được */
export default function FaqsPage() {
  return (
    <Container as="section" className="pb-16 pt-10 sm:pb-20 sm:pt-16 xl:px-16 2xl:pt-20">
      <FaqsExperience />
    </Container>
  );
}
