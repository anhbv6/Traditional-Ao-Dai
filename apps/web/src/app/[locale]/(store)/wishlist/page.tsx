import React from "react";
import { WishlistExperience } from "@/features/wishlist";
import { Container } from "@/components/ui/container";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

export default function WishlistPage() {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.wishlist}>
      <Container as="section" width="full">
        <WishlistExperience />
      </Container>
    </ClientMessages>
  );
}
