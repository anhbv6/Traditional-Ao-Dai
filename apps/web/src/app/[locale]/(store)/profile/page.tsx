import React from "react";
import { ProfileExperience } from "@/features/profile";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Container as="section" className="bg-[#FAF7F5] min-h-screen">
        <Breadcrumbs />
        <ProfileExperience />
      </Container>
    </ProtectedRoute>
  );
}
