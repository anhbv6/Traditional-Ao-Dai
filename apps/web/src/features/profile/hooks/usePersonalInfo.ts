"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { getErrorMessage } from "@/lib/api-client";
import { showToast as toast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { translateProfileResponse } from "../utils/translateProfileResponse";
import { updateProfileApi } from "../api/profile.api";
import { usePersonalInfoStore } from "../store/personalInfoStore";

export function usePersonalInfo() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const t = useTranslations("ProfilePage.personal");
  const tProfile = useTranslations("ProfilePage");
  const form = usePersonalInfoStore(
    useShallow((state) => ({
      isEditing: state.isEditing,
      setIsEditing: state.setIsEditing,
      fullName: state.fullName,
      setFullName: state.setFullName,
      email: state.email,
      setEmail: state.setEmail,
      phone: state.phone,
      setPhone: state.setPhone,
      gender: state.gender,
      setGender: state.setGender,
      dob: state.dob,
      setDob: state.setDob,
      avatarUrl: state.avatarUrl,
      setAvatarUrl: state.setAvatarUrl,
    }))
  );
  const loadUserIntoForm = usePersonalInfoStore((state) => state.loadUserIntoForm);

  useEffect(() => {
    loadUserIntoForm(user);
  }, [loadUserIntoForm, user]);

  const updateProfileMutation = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: (response) => {
      const updatedUser = response.data;
      setUser(updatedUser);
      queryClient.setQueryData(["me"], updatedUser);
      loadUserIntoForm(updatedUser);
      form.setIsEditing(false);
      toast.success(translateProfileResponse(tProfile, response.message, t("successMsg")));
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error, t("updateError"));
      toast.error(translateProfileResponse(tProfile, message, t("updateError")));
    },
  });

  const handleSubmit = (e: React.FormEvent, overrideAvatarUrl?: string) => {
    e.preventDefault();
    let genderNumeric = 2;
    if (form.gender === "male" || form.gender === "0") genderNumeric = 0;
    else if (form.gender === "female" || form.gender === "1") genderNumeric = 1;
    else genderNumeric = 2;

    updateProfileMutation.mutate({
      name: form.fullName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      avatar: overrideAvatarUrl !== undefined ? overrideAvatarUrl : (form.avatarUrl || undefined),
      dob: form.dob || undefined,
      gender: genderNumeric,
    });
  };

  const handleStartEdit = () => {
    loadUserIntoForm(user);
    form.setIsEditing(true);
  };

  const handleCancelEdit = () => {
    loadUserIntoForm(user);
    form.setIsEditing(false);
  };

  return {
    ...form,
    handleStartEdit,
    handleCancelEdit,
    handleSubmit,
    isLoading: updateProfileMutation.isPending,
    user,
  };
}
