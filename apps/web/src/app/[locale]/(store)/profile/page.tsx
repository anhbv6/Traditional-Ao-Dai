import React from "react";
import { ProfileExperience } from "@/features/profile";
import { Container } from "@/components/ui/container";

export default function ProfilePage() {
  return (
    <Container as="section" className="min-h-screen">
      <ProfileExperience />
    </Container>
  );
}
