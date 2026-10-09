import React from "react";
import { ProfileExperience } from "@/features/profile";
import { Container } from "@/components/ui/container";

export default function ProfilePage() {
  return (
    <Container as="section" className="bg-[#FAF7F5] min-h-screen pb-12">
      <ProfileExperience />
    </Container>
  );
}
