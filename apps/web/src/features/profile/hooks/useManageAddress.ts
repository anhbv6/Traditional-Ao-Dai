"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";
import { type Address, type AddressPayload } from "../types/profile.types";
import { getErrorMessage, translateMessage } from "@/lib/messages";
import { useAddressStore } from "../store/addressStore";
import { showToast as toast } from "@/components/ui/toast";
import {
  createAddressApi,
  deleteAddressApi,
  getUserAddressesApi,
  setDefaultAddressApi,
  updateAddressApi,
} from "../api/address.api";

const ADDRESS_QUERY_KEY = ["userAddresses"] as const;

type ApiMessageResponse = {
  message?: string;
};

const getResponseMessage = (response: unknown, fallbackKey: string) => {
  if (response && typeof response === "object" && "message" in response) {
    return String((response as ApiMessageResponse).message);
  }

  return fallbackKey;
};

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
    onSuccess: (response) => {
      refreshAddresses();
      const fallback = t("responses.SET_DEFAULT_ADDRESS_SUCCESS");
      const message = getResponseMessage(response, "SET_DEFAULT_ADDRESS_SUCCESS");
      toast.success(translateMessage(message, fallback, t));
    },
    onError: (error: unknown) => {
      const fallback = t("responses.SET_DEFAULT_ADDRESS_ERROR");
      const message = getErrorMessage(error, fallback);
      toast.error(translateMessage(message, fallback, t));
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
    onSuccess: (response) => {
      refreshAddresses();
      const fallback = t("responses.CREATE_ADDRESS_SUCCESS");
      const message = getResponseMessage(response, "CREATE_ADDRESS_SUCCESS");
      toast.success(translateMessage(message, fallback, t));
      closeForm();
    },
    onError: (error: unknown) => {
      const fallback = t("responses.CREATE_ADDRESS_ERROR");
      const message = getErrorMessage(error, fallback);
      toast.error(translateMessage(message, fallback, t));
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: updateAddressApi,
    onSuccess: (response) => {
      refreshAddresses();
      const fallback = t("responses.UPDATE_ADDRESS_SUCCESS");
      const message = getResponseMessage(response, "UPDATE_ADDRESS_SUCCESS");
      toast.success(translateMessage(message, fallback, t));
      closeForm();
    },
    onError: (error: unknown) => {
      const fallback = t("responses.UPDATE_ADDRESS_ERROR");
      const message = getErrorMessage(error, fallback);
      toast.error(translateMessage(message, fallback, t));
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
    onSuccess: (response) => {
      refreshAddresses();
      const fallback = t("responses.DELETE_ADDRESS_SUCCESS");
      const message = getResponseMessage(response, "DELETE_ADDRESS_SUCCESS");
      toast.success(translateMessage(message, fallback, t));
    },
    onError: (error: unknown) => {
      const fallback = t("responses.DELETE_ADDRESS_ERROR");
      const message = getErrorMessage(error, fallback);
      toast.error(translateMessage(message, fallback, t));
    },
  });

  return {
    handleDelete: deleteAddressMutation.mutate,
    isDeleting: deleteAddressMutation.isPending,
  };
}
