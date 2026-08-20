"use client";

import React, { useState } from "react";
import { type TabId, type Address, type PaymentCard, type Order } from "../types/profile.types";
import { initialAddresses, initialCards } from "../api/profile.api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { type AuthUser } from "@/features/auth/types/auth.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// Coordinator Hook
export function useProfile() {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  return {
    activeTab,
    setActiveTab,
  };
}

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

// Personal Info Hook
export function usePersonalInfo() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const initialFormValues = getPersonalInfoFormValues(user);

  const [fullName, setFullName] = useState(initialFormValues.fullName);
  const [email, setEmail] = useState(initialFormValues.email);
  const [phone, setPhone] = useState(initialFormValues.phone);
  const [gender, setGender] = useState(initialFormValues.gender);
  const [dob, setDob] = useState(initialFormValues.dob);
  const [avatarUrl, setAvatarUrl] = useState(initialFormValues.avatarUrl);
  const [showSuccess, setShowSuccess] = useState(false);

  // React Query Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: {
      name?: string;
      phone?: string;
      avatar?: string;
      dob?: string;
      gender?: string;
    }) => {
      const data = await apiClient.put<{ data: AuthUser }>("/api/user/profile", payload);
      return data.data; // safeUser object returned
    },
    onSuccess: (updatedUser) => {
      // 1. Direct update to Zustand Global State
      setUser(updatedUser);

      // 2. Direct update to React Query server state cache
      queryClient.setQueryData(["me"], updatedUser);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra trong quá trình cập nhật";
      alert(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: fullName,
      phone: phone || undefined,
      avatar: avatarUrl || undefined,
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
    showSuccess,
    handleSubmit,
    isLoading: updateProfileMutation.isPending,
  };
}

// Manage Address Hook
export function useManageAddress() {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formProvince, setFormProvince] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formWard, setFormWard] = useState("");
  const [formDetail, setFormDetail] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);

  const handleStartAdd = () => {
    setEditingAddress(null);
    setFormName("");
    setFormPhone("");
    setFormProvince("");
    setFormDistrict("");
    setFormWard("");
    setFormDetail("");
    setFormIsDefault(false);
    setIsEditing(true);
  };

  const handleStartEdit = (addr: Address) => {
    setEditingAddress(addr);
    setFormName(addr.name);
    setFormPhone(addr.phone);
    setFormProvince(addr.province);
    setFormDistrict(addr.district);
    setFormWard(addr.ward);
    setFormDetail(addr.detail);
    setFormIsDefault(addr.isDefault);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const addressData: Address = {
      id: editingAddress?.id ?? `addr-${Date.now()}`,
      name: formName,
      phone: formPhone,
      province: formProvince,
      district: formDistrict,
      ward: formWard,
      detail: formDetail,
      isDefault: formIsDefault,
    };

    setAddresses((prev) => {
      let nextAddresses = [...prev];
      if (editingAddress) {
        nextAddresses = nextAddresses.map((a) =>
          a.id === editingAddress.id ? addressData : a
        );
      } else {
        nextAddresses.push(addressData);
      }

      if (addressData.isDefault) {
        nextAddresses = nextAddresses.map((a) => ({
          ...a,
          isDefault: a.id === addressData.id,
        }));
      } else if (nextAddresses.length === 1) {
        nextAddresses[0].isDefault = true;
      }

      return nextAddresses;
    });

    setIsEditing(false);
    setEditingAddress(null);
  };

  return {
    addresses,
    isEditing,
    setIsEditing,
    editingAddress,
    formName,
    setFormName,
    formPhone,
    setFormPhone,
    formProvince,
    setFormProvince,
    formDistrict,
    setFormDistrict,
    formWard,
    setFormWard,
    formDetail,
    setFormDetail,
    formIsDefault,
    setFormIsDefault,
    handleStartAdd,
    handleStartEdit,
    handleDelete,
    handleSetDefault,
    handleSubmit,
  };
}

// Manage Payment Hook
export function useManagePayment() {
  const [cards, setCards] = useState<PaymentCard[]>(initialCards);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handleStartAdd = () => {
    setHolder("");
    setNumber("");
    setExpiry("");
    setCvv("");
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    setCards((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length > 0 && !filtered.some((c) => c.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const handleSetDefault = (id: string) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isDefault: c.id === id,
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cardType = number.startsWith("5") ? "mastercard" : "visa";
    const formattedNumber = `•••• •••• •••• ${number.slice(-4) || "0000"}`;

    const newCard: PaymentCard = {
      id: `card-${Date.now()}`,
      holder: holder.toUpperCase(),
      number: formattedNumber,
      expiry: expiry,
      type: cardType,
      isDefault: cards.length === 0,
    };

    setCards((prev) => [...prev, newCard]);
    setIsAdding(false);
  };

  return {
    cards,
    isAdding,
    setIsAdding,
    holder,
    setHolder,
    number,
    setNumber,
    expiry,
    setExpiry,
    cvv,
    setCvv,
    handleStartAdd,
    handleDelete,
    handleSetDefault,
    handleSubmit,
  };
}

// Setting Hook
export function useSetting() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showSuccessPass, setShowSuccessPass] = useState(false);

  const [notifPromo, setNotifPromo] = useState(true);
  const [notifOrder, setNotifOrder] = useState(true);
  const [showSuccessNotif, setShowSuccessNotif] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    setShowSuccessPass(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setShowSuccessPass(false), 3000);
  };

  const handleNotifSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccessNotif(true);
    setTimeout(() => setShowSuccessNotif(false), 3000);
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    showSuccessPass,
    notifPromo,
    setNotifPromo,
    notifOrder,
    setNotifOrder,
    showSuccessNotif,
    handlePasswordSubmit,
    handleNotifSubmit,
  };
}

// Order History Hook
export function useOrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return {
    selectedOrder,
    setSelectedOrder,
  };
}

// Helper to parse User-Agent
function parseUserAgent(ua: string) {
  if (!ua) return { device: 'Thiết bị không rõ', browser: 'Trình duyệt không rõ' };
  
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  let device = 'Máy tính';

  if (ua.includes('Windows')) {
    os = 'Windows';
    device = 'Windows PC';
  } else if (ua.includes('Macintosh') || ua.includes('Mac OS X')) {
    os = 'macOS';
    device = 'MacBook';
  } else if (ua.includes('iPhone')) {
    os = 'iOS';
    device = 'iPhone';
  } else if (ua.includes('iPad')) {
    os = 'iOS';
    device = 'iPad';
  } else if (ua.includes('Android')) {
    os = 'Android';
    device = 'Android Phone';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
    device = 'Linux PC';
  }

  if (ua.includes('Edg/')) {
    browser = `Edge (${os})`;
  } else if (ua.includes('Chrome/') || ua.includes('CriOS/')) {
    browser = `Chrome (${os})`;
  } else if (ua.includes('Firefox/') || ua.includes('FxiOS/')) {
    browser = `Firefox (${os})`;
  } else if (ua.includes('Safari/') && ua.includes('Version/')) {
    browser = `Safari (${os})`;
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    browser = `Opera (${os})`;
  } else {
    browser = `Trình duyệt (${os})`;
  }

  return { device, browser };
}

// Helper to format relative time
function formatRelativeTime(dateStr: string, isCurrent: boolean) {
  if (isCurrent) return 'Đang hoạt động';
  const date = new Date(dateStr);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes}, ${day}/${month}/${year}`;
}

interface RawSession {
  id: string;
  device: string;
  ip: string;
  createdAt: string;
  isCurrent: boolean;
}

// Security Hook
export function useSecurity() {
  const { user, setUser } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showSuccessPass, setShowSuccessPass] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showSuccess2fa, setShowSuccess2fa] = useState(false);

  // Fetch active login sessions
  const { data: rawSessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["userSessions"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawSession[] }>("/api/user/sessions");
      return response.data || [];
    },
  });

  // Map backend session data to frontend structure
  const sessions = rawSessions.map((sess: RawSession) => {
    const { device, browser } = parseUserAgent(sess.device);
    return {
      id: sess.id,
      device: device,
      browser: browser,
      ip: sess.ip,
      location: "Việt Nam",
      time: formatRelativeTime(sess.createdAt, sess.isCurrent),
      isCurrent: sess.isCurrent,
    };
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword?: string; newPassword: string }) => {
      return apiClient.post("/api/user/change-password", payload);
    },
    onSuccess: () => {
      setShowSuccessPass(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowSuccessPass(false), 3000);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra khi đổi mật khẩu";
      alert(message);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp.");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: currentPassword || undefined,
      newPassword,
    });
  };

  const handle2faToggle = () => {
    if (twoFactorEnabled) {
      setTwoFactorEnabled(false);
    } else {
      setShow2faSetup(true);
    }
  };

  const handle2faVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      setTwoFactorEnabled(true);
      setShow2faSetup(false);
      setOtpCode("");
      setShowSuccess2fa(true);
      setTimeout(() => setShowSuccess2fa(false), 3000);
    } else {
      alert("Mã OTP không hợp lệ.");
    }
  };

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiClient.delete(`/api/user/session/${sessionId}`);
    },
    onSuccess: () => {
      refetchSessions();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra khi hủy phiên đăng nhập";
      alert(message);
    },
  });

  const handleRevokeSession = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này không?")) {
      revokeSessionMutation.mutate(id);
    }
  };

  const isGoogleLinked = !!user?.socialAccounts?.some(
    (sa) => sa.provider === "GOOGLE"
  );
  
  const googleProviderId = user?.socialAccounts?.find(
    (sa) => sa.provider === "GOOGLE"
  )?.providerId || null;

  // Link Google Account mutation
  const linkGoogleMutation = useMutation({
    mutationFn: async (credential: string) => {
      return apiClient.post("/api/user/link", { credential });
    },
    onSuccess: async () => {
      const response = await apiClient.get<{ data: AuthUser }>("/api/auth/me");
      if (response.data) {
        setUser(response.data);
      }
      alert("Liên kết tài khoản Google thành công!");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra khi liên kết tài khoản";
      alert(message);
    },
  });

  // Unlink Google Account mutation
  const unlinkGoogleMutation = useMutation({
    mutationFn: async (providerId: string) => {
      return apiClient.delete(`/api/user/unlink/${providerId}`);
    },
    onSuccess: async () => {
      const response = await apiClient.get<{ data: AuthUser }>("/api/auth/me");
      if (response.data) {
        setUser(response.data);
      }
      alert("Hủy liên kết tài khoản Google thành công!");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra khi hủy liên kết";
      alert(message);
    },
  });

  const handleLinkGoogle = (credential: string) => {
    linkGoogleMutation.mutate(credential);
  };

  const handleUnlinkGoogle = () => {
    if (googleProviderId) {
      if (confirm("Bạn có chắc chắn muốn hủy liên kết với tài khoản Google này không?")) {
        unlinkGoogleMutation.mutate(googleProviderId);
      }
    }
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    showSuccessPass,
    handlePasswordSubmit,
    twoFactorEnabled,
    handle2faToggle,
    show2faSetup,
    setShow2faSetup,
    otpCode,
    setOtpCode,
    handle2faVerify,
    showSuccess2fa,
    sessions,
    handleRevokeSession,
    isGoogleLinked,
    handleLinkGoogle,
    handleUnlinkGoogle,
    isLinking: linkGoogleMutation.isPending || unlinkGoogleMutation.isPending,
  };
}

