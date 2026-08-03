"use client";

import React, { useState } from "react";
import { type TabId, type Address, type PaymentCard, type Order } from "../types/profile.types";
import { initialAddresses, initialCards } from "../api/profile.api";

// Coordinator Hook
export function useProfile() {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  return {
    activeTab,
    setActiveTab,
  };
}

// Personal Info Hook
export function usePersonalInfo() {
  const [fullName, setFullName] = useState("Nguyễn Thị An");
  const [email, setEmail] = useState("an.nguyen@gmail.com");
  const [phone, setPhone] = useState("0912345678");
  const [gender, setGender] = useState("female");
  const [dob, setDob] = useState("1998-10-20");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
