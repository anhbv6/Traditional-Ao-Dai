"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";
import { type Address, type AddressPayload } from "../types/profile.types";
import { getErrorMessage } from "@/lib/api-client";
import { useAddressStore } from "../store/addressStore";
import { showToast as toast } from "@/components/ui/toast";
import { translateProfileResponse } from "../utils/translateProfileResponse";
import {
  createAddressApi,
  deleteAddressApi,
  getUserAddressesApi,
  setDefaultAddressApi,
  updateAddressApi,
} from "../api/address.api";

const ADDRESS_QUERY_KEY = ["userAddresses"] as const;

function useRefreshAddresses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEY });
}

export function useManageAddress() {
  const t = useTranslations("ProfilePage");
  const refreshAddresses = useRefreshAddresses();
  const { resetForm, setIsEditing, loadAddressIntoForm } = useAddressStore(
    useShallow((state) => ({
      resetForm: state.resetForm,
      setIsEditing: state.setIsEditing,
      loadAddressIntoForm: state.loadAddressIntoForm,
    }))
  );
  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ADDRESS_QUERY_KEY,
    queryFn: getUserAddressesApi,
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: setDefaultAddressApi,
    onSuccess: () => {
      refreshAddresses();
      toast.success("Đã đặt làm địa chỉ mặc định!");
    },
    onError: (error: unknown) => {
      const fallback = "Không thể đặt địa chỉ mặc định";
      const message = getErrorMessage(error, fallback);
      toast.error(translateProfileResponse(t, message, fallback));
    },
  });

  const handleStartAdd = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleStartEdit = (addr: Address) => {
    loadAddressIntoForm(addr);
    setIsEditing(true);
  };

  return {
    addresses,
    isLoading,
    handleStartAdd,
    handleStartEdit,
    handleSetDefault: setDefaultAddressMutation.mutate,
    isSettingDefault: setDefaultAddressMutation.isPending,
  };
}

export function useAddressForm() {
  const t = useTranslations("ProfilePage");
  const refreshAddresses = useRefreshAddresses();
  const form = useAddressStore(
    useShallow((state) => ({
      isEditing: state.isEditing,
      setIsEditing: state.setIsEditing,
      editingAddress: state.editingAddress,
      formName: state.formReceiverName,
      setFormName: state.setFormReceiverName,
      formPhone: state.formReceiverPhone,
      setFormPhone: state.setFormReceiverPhone,
      formAddressLine: state.formAddressLine,
      setFormAddressLine: state.setFormAddressLine,
      formProvinceName: state.formProvinceName,
      setFormProvinceName: state.setFormProvinceName,
      formProvinceCode: state.formProvinceCode,
      setFormProvinceCode: state.setFormProvinceCode,
      formDistrictName: state.formDistrictName,
      setFormDistrictName: state.setFormDistrictName,
      formDistrictCode: state.formDistrictCode,
      setFormDistrictCode: state.setFormDistrictCode,
      formWardName: state.formWardName,
      setFormWardName: state.setFormWardName,
      formWardCode: state.formWardCode,
      setFormWardCode: state.setFormWardCode,
      formLabel: state.formLabel,
      setFormLabel: state.setFormLabel,
      formIsDefault: state.formIsDefault,
      setFormIsDefault: state.setFormIsDefault,
    }))
  );

  const closeForm = () => {
    useAddressStore.getState().resetForm();
    form.setIsEditing(false);
  };

  const createAddressMutation = useMutation({
    mutationFn: createAddressApi,
    onSuccess: () => {
      refreshAddresses();
      toast.success("Thêm địa chỉ thành công!");
      closeForm();
    },
    onError: (error: unknown) => {
      const fallback = "Không thể thêm địa chỉ";
      const message = getErrorMessage(error, "Không thể thêm địa chỉ");
      toast.error(translateProfileResponse(t, message, fallback));
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: updateAddressApi,
    onSuccess: () => {
      refreshAddresses();
      toast.success("Cập nhật địa chỉ thành công!");
      closeForm();
    },
    onError: (error: unknown) => {
      const fallback = "Không thể cập nhật địa chỉ";
      const message = getErrorMessage(error, fallback);
      toast.error(translateProfileResponse(t, message, fallback));
    },
  });

  const buildPayload = (): AddressPayload => {
    const state = useAddressStore.getState();

    return {
      receiverName: state.formReceiverName.trim(),
      receiverPhone: state.formReceiverPhone.trim(),
      addressLine: state.formAddressLine.trim(),
      provinceName: state.formProvinceName.trim(),
      provinceCode: state.formProvinceCode || null,
      districtName: state.formDistrictName.trim(),
      districtCode: state.formDistrictCode || null,
      wardName: state.formWardName.trim(),
      wardCode: state.formWardCode || null,
      postalCode: state.formPostalCode || null,
      label: state.formLabel.trim() || null,
      isDefault: state.formIsDefault,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { editingAddress } = useAddressStore.getState();
    const payload = buildPayload();

    if (editingAddress) {
      updateAddressMutation.mutate({
        id: editingAddress.id,
        payload,
      });
    } else {
      createAddressMutation.mutate(payload);
    }
  };

  return {
    ...form,
    handleSubmit,
    isMutating: createAddressMutation.isPending || updateAddressMutation.isPending,
  };
}

export function useDeleteAddress() {
  const t = useTranslations("ProfilePage");
  const refreshAddresses = useRefreshAddresses();
  const deleteAddressMutation = useMutation({
    mutationFn: deleteAddressApi,
    onSuccess: () => {
      refreshAddresses();
      toast.success("Đã xóa địa chỉ thành công!");
    },
    onError: (error: unknown) => {
      const fallback = "Không thể xóa địa chỉ";
      const message = getErrorMessage(error, fallback);
      toast.error(translateProfileResponse(t, message, fallback));
    },
  });

  return {
    handleDelete: deleteAddressMutation.mutate,
    isDeleting: deleteAddressMutation.isPending,
  };
}
