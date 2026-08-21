"use client";

import { useState } from "react";
import { type Address } from "../types/profile.types";
import { initialAddresses } from "../api/profile.api";

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
