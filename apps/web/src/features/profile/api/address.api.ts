import { apiClient } from "@/lib/api-client";
import { type Address, type AddressPayload } from "../types/profile.types";

export const getUserAddressesApi = async (): Promise<Address[]> => {
  const response = await apiClient.get<{ data: Address[] }>("/api/user/addresses");
  return response.data || [];
};

export const createAddressApi = async (payload: AddressPayload): Promise<unknown> => {
  return apiClient.post("/api/user/addresses", payload);
};

export const updateAddressApi = async ({
  id,
  payload,
}: {
  id: string;
  payload: Partial<AddressPayload>;
}): Promise<unknown> => {
  return apiClient.patch(`/api/user/addresses/${id}`, payload);
};

export const setDefaultAddressApi = async (id: string): Promise<unknown> => {
  return apiClient.patch(`/api/user/addresses/${id}/default`, {});
};

export const deleteAddressApi = async (id: string): Promise<unknown> => {
  return apiClient.delete(`/api/user/addresses/${id}`);
};
