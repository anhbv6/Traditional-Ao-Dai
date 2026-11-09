import { create } from "zustand";
import { mockMeasurements } from "../data/mockMeasurements";
import { type MeasurementProfile, type MeasurementProfileInput } from "../types/profile.types";

interface MeasurementState {
  profiles: MeasurementProfile[];
  add: (input: MeasurementProfileInput) => void;
  update: (id: string, input: MeasurementProfileInput) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
}

/** Luôn đúng một bộ mặc định: bộ được chọn (nếu có), không thì bộ đầu tiên */
function normalizeDefault(profiles: MeasurementProfile[], defaultId?: string): MeasurementProfile[] {
  if (profiles.length === 0) return profiles;
  const targetId = profiles.some((profile) => profile.id === defaultId)
    ? defaultId
    : (profiles.find((profile) => profile.isDefault) ?? profiles[0]).id;
  return profiles.map((profile) => ({ ...profile, isDefault: profile.id === targetId }));
}

const newId = () => `measure-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * Sổ số đo — MOCK TẠM giữ trong bộ nhớ (không persist: quy tắc không lưu thông tin người dùng vào localStorage).
 * Khi có API `/api/user/measurements`, chuyển sang React Query (`useQuery` / `useMutation`).
 */
export const useMeasurementStore = create<MeasurementState>((set) => ({
  profiles: mockMeasurements,
  add: (input) =>
    set(({ profiles }) => {
      const id = newId();
      const next = [...profiles, { ...input, id }];
      return { profiles: normalizeDefault(next, input.isDefault ? id : undefined) };
    }),
  update: (id, input) =>
    set(({ profiles }) => {
      const next = profiles.map((profile) => (profile.id === id ? { ...input, id } : profile));
      return { profiles: normalizeDefault(next, input.isDefault ? id : undefined) };
    }),
  remove: (id) => set(({ profiles }) => ({ profiles: normalizeDefault(profiles.filter((profile) => profile.id !== id)) })),
  setDefault: (id) => set(({ profiles }) => ({ profiles: normalizeDefault(profiles, id) })),
}));
