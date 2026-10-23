"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/features/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { getErrorMessage, translateMessage } from "@/lib/messages";
import { showToast as toast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
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
      toast.success(translateMessage(response.message, t("successMsg"), tProfile));
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error, t("updateError"));
      toast.error(translateMessage(message, t("updateError"), tProfile));
    },
  });

  /** Gửi cập nhật — `overrides` dùng cho giá trị vừa tính trong handler (avatar vừa tải lên, ngày sinh vừa chuẩn hoá) */
  const handleSubmit = (overrides: { avatarUrl?: string; dob?: string } = {}) => {
    const avatarUrl = overrides.avatarUrl !== undefined ? overrides.avatarUrl : form.avatarUrl;
    const gender = form.gender.toUpperCase();

    updateProfileMutation.mutate({
      name: form.fullName,
      // Email & SĐT không gửi ở đây: đổi qua luồng xác minh mã (useContactVerification)
      avatarUrl: avatarUrl || null,
      birthDate: (overrides.dob ?? form.dob) || null,
      gender: gender === "MALE" || gender === "FEMALE" ? gender : "OTHER",
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
