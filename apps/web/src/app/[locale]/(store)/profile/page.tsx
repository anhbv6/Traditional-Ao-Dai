import React from "react";
import { ProfileExperience } from "@/features/profile";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileExperience />
    </ProtectedRoute>
  );
}
