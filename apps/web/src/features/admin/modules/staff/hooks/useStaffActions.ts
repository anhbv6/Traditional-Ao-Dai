"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { type Permission } from "../../../core/session/permissions";
import { toggleStaffActiveAction, updateStaffPermissionAction } from "../actions/staff.actions";

export type StaffPatch = { id: string; permissions: Permission[] } | { id: string; status: "ACTIVE" | "LOCKED" };

/**
 * Đổi quyền / khóa-mở nhân viên qua Server Action + React Query; thành công thì báo, áp tại chỗ (`onPatch`) rồi tải lại server.
 */
export function useStaffActions(onPatch: (patch: StaffPatch) => void) {
  const tToast = useTranslations("AdminPage.toasts");
  const notify = useNotify();
  const router = useRouter();

  const setPermissions = useMutation({
    mutationFn: (input: { userId: string; permissions: Permission[] }) => updateStaffPermissionAction(input.userId, input.permissions),
    onSuccess: (res) => {
      if (!res.success) return notify.error(res.error, "STAFF_PERMISSION_UPDATE_FAILED");
      notify.success(tToast("permissionUpdateSuccess"));
      onPatch({ id: res.data.id, permissions: res.data.permissions });
      router.refresh();
    },
    onError: () => notify.error("STAFF_PERMISSION_UPDATE_FAILED"),
  });

  const setActive = useMutation({
    mutationFn: (input: { userId: string; isActive: boolean }) => toggleStaffActiveAction(input.userId, input.isActive),
    onSuccess: (res) => {
      if (!res.success) return notify.error(res.error, "STAFF_STATUS_UPDATE_FAILED");
      const status = res.data.status === "LOCKED" ? "LOCKED" : "ACTIVE";
      notify.success(tToast(status === "LOCKED" ? "staffLocked" : "staffUnlocked"));
      onPatch({ id: res.data.id, status });
      router.refresh();
    },
    onError: () => notify.error("STAFF_STATUS_UPDATE_FAILED"),
  });

  return { setPermissions, setActive };
}
