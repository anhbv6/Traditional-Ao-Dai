import React from "react";
import { WishlistExperience } from "@/features/wishlist";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export default function WishlistPage() {
  return (
    <Container as="section" className="py-8 sm:py-12">
      <Breadcrumbs />
      <WishlistExperience />
    </Container>
  );
}
