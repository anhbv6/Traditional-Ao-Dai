"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Users, Shield, RefreshCw, Lock, Unlock, UserPlus, KeyRound } from "lucide-react";
import { useNotify } from "@/hooks/useNotify";
import { getStaffListAction, updateStaffPermissionAction, toggleStaffActiveAction } from "../actions/staff.actions";
import { type StaffMemberItem } from "../types/staff.types";
import { STAFF_PERMISSIONS, type Permission } from "../../../core/session/permissions";
import { ADMIN_CARD_CLASS, AdminPageHeader, AdminSecondaryButton } from "@/features/admin/core/ui";
import { CreateStaffDialog } from "./CreateStaffDialog";
import { ResetStaffPasswordDialog } from "./ResetStaffPasswordDialog";

const STAFF_QUERY_KEY = ["admin", "staff"] as const;

export function AdminStaffManagement() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const t = useTranslations("AdminPage.staff");
  const tToast = useTranslations("AdminPage.toasts");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffMemberItem | null>(null);

  // Dữ liệu server -> React Query; cập nhật lạc quan (optimistic) bằng setQueryData
  const { data: staffList = [], isFetching: isLoading, refetch } = useQuery({
    queryKey: STAFF_QUERY_KEY,
    queryFn: async () => {
      const res = await getStaffListAction();
      if (!res.success) {
        notify.error(res.error, "STAFF_LIST_FAILED");
        return [];
      }
      return (res.data ?? []) as StaffMemberItem[];
    },
  });

  const setStaffList = (updater: (prev: StaffMemberItem[]) => StaffMemberItem[]) =>
    queryClient.setQueryData<StaffMemberItem[]>(STAFF_QUERY_KEY, (prev) => updater(prev ?? []));

  const handleTogglePermission = async (staff: StaffMemberItem, permission: Permission) => {
    setUpdatingId(staff.id);
    const nextPermissions = staff.permissions.includes(permission)
      ? staff.permissions.filter((p) => p !== permission)
      : [...staff.permissions, permission];

    const res = await updateStaffPermissionAction(staff.id, nextPermissions);
    if (res.success) {
      notify.success(tToast("permissionUpdateSuccess"));
      setStaffList((prev) => prev.map((s) => (s.id === staff.id ? { ...s, permissions: res.data.permissions } : s)));
    } else {
      notify.error(res.error, "STAFF_PERMISSION_UPDATE_FAILED");
    }
    setUpdatingId(null);
  };

  const handleToggleActive = async (staffId: string, currentActive: boolean) => {
    setUpdatingId(staffId);
    const res = await toggleStaffActiveAction(staffId, !currentActive);
    if (res.success) {
      notify.success(tToast(!currentActive ? "staffUnlocked" : "staffLocked"));
      setStaffList((prev) => prev.map((s) => (s.id === staffId ? { ...s, status: res.data.status } : s)));
    } else {
      notify.error(res.error, "STAFF_STATUS_UPDATE_FAILED");
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Users}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <AdminSecondaryButton onClick={() => void refetch()} disabled={isLoading}>
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              <span>{t("refresh")}</span>
            </AdminSecondaryButton>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#18181B] px-3 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#09090B]"
            >
              <UserPlus size={14} />
              <span>{t("create")}</span>
            </button>
          </>
        }
      />

      {isLoading && staffList.length === 0 ? (
        <div className={`${ADMIN_CARD_CLASS} p-12 text-center text-sm text-[#71717A]`}>
          <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-zinc-400" />
          <p>{t("loading")}</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className={`${ADMIN_CARD_CLASS} p-12 text-center text-[#71717A]`}>
          <Shield size={32} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-700">{t("empty.title")}</p>
          <p className="mt-1 text-xs text-zinc-400">{t("empty.description")}</p>
        </div>
      ) : (
        <div className={`${ADMIN_CARD_CLASS} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="border-b border-[#E4E4E7] bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
                <tr>
                  <th className="px-5 py-3.5">{t("columns.staff")}</th>
                  {STAFF_PERMISSIONS.map((permission) => (
                    <th key={permission} className="px-4 py-3.5 text-center">
                      {t(`permissions.${permission}`)}
                    </th>
                  ))}
                  <th className="px-4 py-3.5 text-center">{t("columns.status")}</th>
                  <th className="px-4 py-3.5 text-center">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {staffList.map((staff) => {
                  const isUpdating = updatingId === staff.id;
                  const isActive = staff.status === "ACTIVE";

                  return (
                    <tr key={staff.id} className="transition-colors hover:bg-zinc-50/50">
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-[#09090B]">{staff.name || t("unnamed")}</div>
                        <div className="text-[11px] text-[#71717A]">{staff.email || staff.phone}</div>
                      </td>

                      {STAFF_PERMISSIONS.map((permission) => (
                        <td key={permission} className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            aria-label={t(`permissions.${permission}`)}
                            checked={staff.permissions.includes(permission)}
                            onChange={() => handleTogglePermission(staff, permission)}
                            disabled={isUpdating}
                            className="size-4 cursor-pointer rounded border-zinc-300 accent-zinc-900"
                          />
                        </td>
                      ))}

                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(staff.id, isActive)}
                          disabled={isUpdating}
                          className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            isActive
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          }`}
                        >
                          {isActive ? <Unlock size={10} /> : <Lock size={10} />}
                          <span>{isActive ? t("active") : t("locked")}</span>
                        </button>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setResetTarget(staff)}
                          disabled={isUpdating}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#E4E4E7] px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                        >
                          <KeyRound size={11} />
                          <span>{t("resetPassword")}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateStaffDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={(member) => setStaffList((prev) => [member, ...prev])}
      />

      <ResetStaffPasswordDialog staff={resetTarget} onClose={() => setResetTarget(null)} />
    </div>
  );
}
