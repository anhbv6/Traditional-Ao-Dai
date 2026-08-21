"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Address, type AddressPayload } from "../types/profile.types";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { useAddressStore } from "../store/addressStore";
import { showToast as toast } from "@/components/ui/toast";

export function useManageAddress() {
  const queryClient = useQueryClient();
  const store = useAddressStore();

  // 1. Server State: Fetch user addresses
  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ["userAddresses"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Address[] }>("/api/user/addresses");
      return response.data || [];
    },
  });

  // 2. Server State: Create Address Mutation
  const createAddressMutation = useMutation({
    mutationFn: async (payload: AddressPayload) => {
      return apiClient.post("/api/user/addresses", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      toast.success("Thêm địa chỉ thành công!");
      store.resetForm();
      store.setIsEditing(false);
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error, "Không thể thêm địa chỉ");
      toast.error(message === "MAX_ADDRESS_LIMIT_REACHED" ? "Bạn chỉ được lưu tối đa 10 địa chỉ!" : message);
    },
  });

  // 3. Server State: Update Address Mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<AddressPayload> }) => {
      return apiClient.patch(`/api/user/addresses/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      toast.success("Cập nhật địa chỉ thành công!");
      store.resetForm();
      store.setIsEditing(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Không thể cập nhật địa chỉ"));
    },
  });

  // 4. Server State: Set Default Address Mutation
  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch(`/api/user/addresses/${id}/default`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      toast.success("Đã đặt làm địa chỉ mặc định!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Không thể đặt địa chỉ mặc định"));
    },
  });

  // 5. Server State: Delete Address Mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/user/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      toast.success("Đã xóa địa chỉ thành công!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Không thể xóa địa chỉ"));
    },
  });

  // Helper actions
  const handleStartAdd = () => {
    store.resetForm();
    store.setIsEditing(true);
  };

  const handleStartEdit = (addr: Address) => {
    store.loadAddressIntoForm(addr);
    store.setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa địa chỉ này không?")) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultAddressMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: AddressPayload = {
      receiverName: store.formReceiverName.trim(),
      receiverPhone: store.formReceiverPhone.trim(),
      addressLine: store.formAddressLine.trim(),
      provinceName: store.formProvinceName.trim(),
      provinceCode: store.formProvinceCode || null,
      districtName: store.formDistrictName.trim(),
      districtCode: store.formDistrictCode || null,
      wardName: store.formWardName.trim(),
      wardCode: store.formWardCode || null,
      postalCode: store.formPostalCode || null,
      label: store.formLabel.trim() || null,
      isDefault: store.formIsDefault,
    };

    if (store.editingAddress) {
      updateAddressMutation.mutate({
        id: store.editingAddress.id,
        payload,
      });
    } else {
      createAddressMutation.mutate(payload);
    }
  };

  return {
    addresses,
    isLoading,
    isEditing: store.isEditing,
    setIsEditing: store.setIsEditing,
    editingAddress: store.editingAddress,
    formName: store.formReceiverName,
    setFormName: store.setFormReceiverName,
    formPhone: store.formReceiverPhone,
    setFormPhone: store.setFormReceiverPhone,
    formAddressLine: store.formAddressLine,
    setFormAddressLine: store.setFormAddressLine,
    formProvinceName: store.formProvinceName,
    setFormProvinceName: store.setFormProvinceName,
    formProvinceCode: store.formProvinceCode,
    setFormProvinceCode: store.setFormProvinceCode,
    formDistrictName: store.formDistrictName,
    setFormDistrictName: store.setFormDistrictName,
    formDistrictCode: store.formDistrictCode,
    setFormDistrictCode: store.setFormDistrictCode,
    formWardName: store.formWardName,
    setFormWardName: store.setFormWardName,
    formWardCode: store.formWardCode,
    setFormWardCode: store.setFormWardCode,
    formPostalCode: store.formPostalCode,
    setFormPostalCode: store.setFormPostalCode,
    formLabel: store.formLabel,
    setFormLabel: store.setFormLabel,
    formIsDefault: store.formIsDefault,
    setFormIsDefault: store.setFormIsDefault,
    handleStartAdd,
    handleStartEdit,
    handleDelete,
    handleSetDefault,
    handleSubmit,
    isMutating:
      createAddressMutation.isPending ||
      updateAddressMutation.isPending ||
      setDefaultAddressMutation.isPending ||
      deleteAddressMutation.isPending,
  };
}
