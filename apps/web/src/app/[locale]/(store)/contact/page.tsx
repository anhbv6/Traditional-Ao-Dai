import React from "react";
import { ContactExperience } from "@/features/contact";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

/** Trang cấp 1 (ngay dưới trang chủ) — không cần breadcrumb */
function ContactPage() {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.contact}>
      <ContactExperience />
    </ClientMessages>
  );
}

export default ContactPage;
