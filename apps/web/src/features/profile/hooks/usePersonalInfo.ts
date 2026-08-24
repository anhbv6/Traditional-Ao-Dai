/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { type AuthUser } from "@/features/auth/types/auth.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { showToast as toast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { translateProfileResponse } from "../utils/translateProfileResponse";

function getPersonalInfoFormValues(user: AuthUser | null) {
  const birthDate = user?.birth ? new Date(user.birth) : undefined;

  return {
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: user?.gender ? user.gender.toLowerCase() : "other",
    dob: birthDate
      ? [
          birthDate.getFullYear(),
          String(birthDate.getMonth() + 1).padStart(2, "0"),
          String(birthDate.getDate()).padStart(2, "0"),
        ].join("-")
      : "",
    avatarUrl: user?.avatar || "",
  };
}

export function usePersonalInfo() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const t = useTranslations("ProfilePage.personal");
  const tProfile = useTranslations("ProfilePage");
  const initialFormValues = getPersonalInfoFormValues(user);

  const [fullName, setFullName] = useState(initialFormValues.fullName);
  const [email, setEmail] = useState(initialFormValues.email);
  const [phone, setPhone] = useState(initialFormValues.phone);
  const [gender, setGender] = useState(initialFormValues.gender);
  const [dob, setDob] = useState(initialFormValues.dob);
  const [avatarUrl, setAvatarUrl] = useState(initialFormValues.avatarUrl);

  // Synchronize state when database user changes
  useEffect(() => {
    setFullName(initialFormValues.fullName);
    setEmail(initialFormValues.email);
    setPhone(initialFormValues.phone);
    setGender(initialFormValues.gender);
    setDob(initialFormValues.dob);
    setAvatarUrl(initialFormValues.avatarUrl);
  }, [user]);

  // React Query Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      avatar?: string | null;
      dob?: string | null;
      gender?: string;
    }) => {
      const data = await apiClient.put<{ data: AuthUser }>("/api/user/profile", payload);
      return data.data; // safeUser object returned
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(["me"], updatedUser);
      toast.success(t("successMsg"));
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error, t("updateError"));
      toast.error(translateProfileResponse(tProfile, message, t("updateError")));
    },
  });

  const handleSubmit = (e: React.FormEvent, overrideAvatarUrl?: string) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: fullName,
      email: email || undefined,
      phone: phone || undefined,
      avatar: overrideAvatarUrl !== undefined ? overrideAvatarUrl : (avatarUrl || undefined),
      dob: dob || undefined,
      gender: gender.toUpperCase(),
    });
  };

  return {
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    gender,
    setGender,
    dob,
    setDob,
    avatarUrl,
    setAvatarUrl,
    handleSubmit,
    isLoading: updateProfileMutation.isPending,
    user,
  };
}
