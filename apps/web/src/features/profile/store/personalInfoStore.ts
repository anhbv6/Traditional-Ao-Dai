import { create } from "zustand";
import { type AuthUser } from "@/features/auth";

type PersonalInfoFormValues = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  avatarUrl: string;
};

interface PersonalInfoUIState extends PersonalInfoFormValues {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  setFullName: (fullName: string) => void;
  setEmail: (email: string) => void;
  setPhone: (phone: string) => void;
  setGender: (gender: string) => void;
  setDob: (dob: string) => void;
  setAvatarUrl: (avatarUrl: string) => void;
  loadUserIntoForm: (user: AuthUser | null) => void;
}

const getPersonalInfoFormValues = (user: AuthUser | null): PersonalInfoFormValues => ({
  fullName: user?.name || "",
  email: user?.email || "",
  phone: user?.phone || "",
  // Form dùng giá trị chữ thường ("male" | "female" | "other"); API dùng enum MALE | FEMALE | OTHER
  gender: user?.gender ? user.gender.toLowerCase() : "other",
  // API trả sẵn dạng YYYY-MM-DD
  dob: user?.birthDate || "",
  avatarUrl: user?.avatarUrl || "",
});

export const usePersonalInfoStore = create<PersonalInfoUIState>((set) => ({
  isEditing: false,
  fullName: "",
  email: "",
  phone: "",
  gender: "other",
  dob: "",
  avatarUrl: "",

  setIsEditing: (isEditing) => set({ isEditing }),
  setFullName: (fullName) => set({ fullName }),
  setEmail: (email) => set({ email }),
  setPhone: (phone) => set({ phone }),
  setGender: (gender) => set({ gender }),
  setDob: (dob) => set({ dob }),
  setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
  loadUserIntoForm: (user) => set(getPersonalInfoFormValues(user)),
}));
