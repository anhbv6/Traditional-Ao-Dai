import React from "react";
import { WishlistExperience } from "@/features/wishlist";
import { Container } from "@/components/ui/container";

export default function WishlistPage() {
  return (
    <Container as="section" width="full">
      <WishlistExperience />
    </Container>
  );
}
