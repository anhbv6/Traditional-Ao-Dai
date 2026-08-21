import { create } from 'zustand';
import { type Address } from '../types/profile.types';

interface AddressUIState {
  isEditing: boolean;
  editingAddress: Address | null;
  
  // Form values
  formReceiverName: string;
  formReceiverPhone: string;
  formAddressLine: string;
  formProvinceName: string;
  formProvinceCode: string;
  formDistrictName: string;
  formDistrictCode: string;
  formWardName: string;
  formWardCode: string;
  formPostalCode: string;
  formLabel: string;
  formIsDefault: boolean;

  // Actions
  setIsEditing: (isEditing: boolean) => void;
  setEditingAddress: (address: Address | null) => void;
  
  setFormReceiverName: (val: string) => void;
  setFormReceiverPhone: (val: string) => void;
  setFormAddressLine: (val: string) => void;
  setFormProvinceName: (val: string) => void;
  setFormProvinceCode: (val: string) => void;
  setFormDistrictName: (val: string) => void;
  setFormDistrictCode: (val: string) => void;
  setFormWardName: (val: string) => void;
  setFormWardCode: (val: string) => void;
  setFormPostalCode: (val: string) => void;
  setFormLabel: (val: string) => void;
  setFormIsDefault: (val: boolean) => void;
  
  resetForm: () => void;
  loadAddressIntoForm: (address: Address) => void;
}

export const useAddressStore = create<AddressUIState>((set) => ({
  isEditing: false,
  editingAddress: null,

  formReceiverName: '',
  formReceiverPhone: '',
  formAddressLine: '',
  formProvinceName: '',
  formProvinceCode: '',
  formDistrictName: '',
  formDistrictCode: '',
  formWardName: '',
  formWardCode: '',
  formPostalCode: '',
  formLabel: '',
  formIsDefault: false,

  setIsEditing: (isEditing) => set({ isEditing }),
  setEditingAddress: (editingAddress) => set({ editingAddress }),

  setFormReceiverName: (formReceiverName) => set({ formReceiverName }),
  setFormReceiverPhone: (formReceiverPhone) => set({ formReceiverPhone }),
  setFormAddressLine: (formAddressLine) => set({ formAddressLine }),
  setFormProvinceName: (formProvinceName) => set({ formProvinceName }),
  setFormProvinceCode: (formProvinceCode) => set({ formProvinceCode }),
  setFormDistrictName: (formDistrictName) => set({ formDistrictName }),
  setFormDistrictCode: (formDistrictCode) => set({ formDistrictCode }),
  setFormWardName: (formWardName) => set({ formWardName }),
  setFormWardCode: (formWardCode) => set({ formWardCode }),
  setFormPostalCode: (formPostalCode) => set({ formPostalCode }),
  setFormLabel: (formLabel) => set({ formLabel }),
  setFormIsDefault: (formIsDefault) => set({ formIsDefault }),

  resetForm: () => set({
    editingAddress: null,
    formReceiverName: '',
    formReceiverPhone: '',
    formAddressLine: '',
    formProvinceName: '',
    formProvinceCode: '',
    formDistrictName: '',
    formDistrictCode: '',
    formWardName: '',
    formWardCode: '',
    formPostalCode: '',
    formLabel: '',
    formIsDefault: false,
  }),

  loadAddressIntoForm: (address) => set({
    editingAddress: address,
    formReceiverName: address.receiverName,
    formReceiverPhone: address.receiverPhone,
    formAddressLine: address.addressLine,
    formProvinceName: address.provinceName || '',
    formProvinceCode: address.provinceCode || '',
    formDistrictName: address.districtName || '',
    formDistrictCode: address.districtCode || '',
    formWardName: address.wardName || '',
    formWardCode: address.wardCode || '',
    formPostalCode: address.postalCode || '',
    formLabel: address.label || '',
    formIsDefault: address.isDefault,
  }),
}));
