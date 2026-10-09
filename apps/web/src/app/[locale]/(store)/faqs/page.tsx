import React from "react";
import { FaqsExperience } from "@/features/faqs";
import { Container } from "@/components/ui/container";

export default function FaqsPage() {
  return (
    <Container as="section" className="py-8 sm:py-12 bg-[#FAF7F5] min-h-screen overflow-x-hidden">
      <FaqsExperience />
    </Container>
  );
}