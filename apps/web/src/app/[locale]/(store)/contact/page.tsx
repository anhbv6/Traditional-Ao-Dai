import React from "react";
import { ContactExperience } from "@/features/contact";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

function ContactPage() {
  return (
    <Container as="section" className="py-8 sm:py-12">
      <Breadcrumbs />
      <ContactExperience />
    </Container>
  );
}

export default ContactPage;
