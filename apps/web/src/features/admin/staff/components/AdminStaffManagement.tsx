"use client";

import React, { useState, useEffect } from "react";
import { Users, Shield, RefreshCw, Lock, Unlock } from "lucide-react";
import { showToast } from "@/components/ui/toast";
import {
  getStaffListAction,
  updateStaffPermissionAction,
  toggleStaffActiveAction,
} from "../actions";
import { type StaffPermissionInput, type StaffMemberItem } from "../types";

export function AdminStaffManagement() {
  const [staffList, setStaffList] = useState<StaffMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    const res = await getStaffListAction();
    if (res.success && res.data) {
      setStaffList(res.data as StaffMemberItem[]);
    } else {
      showToast.error("Không thể tải danh sách nhân viên.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleTogglePermission = async (
    staffId: string,
    currentPerms: StaffPermissionInput | null,
    field: keyof StaffPermissionInput
  ) => {
    setUpdatingId(staffId);
    const basePerms: StaffPermissionInput = currentPerms || {
      canManageOrders: true,
      canUpdateTailoring: true,
      canManageInventory: false,
      canViewReports: false,
    };

    const newPerms = {
      ...basePerms,
      [field]: !basePerms[field],
    };

    const res = await updateStaffPermissionAction(staffId, newPerms);
    if (res.success) {
      showToast.success("Đã cập nhật phân quyền nhân viên!");
      // Cập nhật state local
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === staffId ? { ...s, staffPermission: { ...s.staffPermission, ...newPerms } as any } : s
        )
      );
    } else {
      showToast.error(res.error || "Không thể cập nhật phân quyền.");
    }
    setUpdatingId(null);
  };

  const handleToggleActive = async (staffId: string, currentActive: boolean) => {
    setUpdatingId(staffId);
    const res = await toggleStaffActiveAction(staffId, !currentActive);
    if (res.success) {
      showToast.success(
        !currentActive ? "Đã mở khóa tài khoản nhân viên!" : "Đã khóa tài khoản nhân viên!"
      );
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, isActive: !currentActive } : s))
      );
    } else {
      showToast.error(res.error || "Không thể cập nhật trạng thái.");
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Users size={20} className="text-zinc-800" />
            <span>Quản Lý Nhân Sự & Phân Quyền Chi Tiết</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Bật/tắt các quyền hạn chi tiết (Granular Permissions) cho từng nhân viên Staff.
          </p>
        </div>

        <button
          onClick={fetchStaff}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center text-sm text-zinc-500">
          <RefreshCw size={24} className="animate-spin mx-auto text-zinc-400 mb-3" />
          <p>Đang tải danh sách nhân sự...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center text-zinc-500">
          <Shield size={32} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-700">Chưa có tài khoản nhân viên nào</p>
          <p className="text-xs text-zinc-400 mt-1">Các tài khoản có Role STAFF sẽ xuất hiện ở bảng này.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-zinc-50/75 border-b border-zinc-200/80 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Nhân viên</th>
                  <th className="px-4 py-3.5 text-center">Tạo/Xem Đơn</th>
                  <th className="px-4 py-3.5 text-center">Tiến độ May đo</th>
                  <th className="px-4 py-3.5 text-center">Kho Vải/SP</th>
                  <th className="px-4 py-3.5 text-center">Báo cáo Doanh thu</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {staffList.map((staff) => {
                  const perms = staff.staffPermission || {
                    canManageOrders: true,
                    canUpdateTailoring: true,
                    canManageInventory: false,
                    canViewReports: false,
                  };

                  return (
                    <tr key={staff.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-zinc-900 text-sm">
                          {staff.name || "Chưa đặt tên"}
                        </div>
                        <div className="text-zinc-500 text-[11px]">
                          {staff.email || staff.phone}
                        </div>
                      </td>

                      {/* canManageOrders */}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(perms.canManageOrders)}
                          onChange={() => handleTogglePermission(staff.id, perms, "canManageOrders")}
                          disabled={updatingId === staff.id}
                          className="size-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900 cursor-pointer"
                        />
                      </td>

                      {/* canUpdateTailoring */}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(perms.canUpdateTailoring)}
                          onChange={() => handleTogglePermission(staff.id, perms, "canUpdateTailoring")}
                          disabled={updatingId === staff.id}
                          className="size-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900 cursor-pointer"
                        />
                      </td>

                      {/* canManageInventory */}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(perms.canManageInventory)}
                          onChange={() => handleTogglePermission(staff.id, perms, "canManageInventory")}
                          disabled={updatingId === staff.id}
                          className="size-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900 cursor-pointer"
                        />
                      </td>

                      {/* canViewReports */}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(perms.canViewReports)}
                          onChange={() => handleTogglePermission(staff.id, perms, "canViewReports")}
                          disabled={updatingId === staff.id}
                          className="size-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900 cursor-pointer"
                        />
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(staff.id, staff.isActive)}
                          disabled={updatingId === staff.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            staff.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          {staff.isActive ? (
                            <>
                              <Unlock size={10} />
                              <span>Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <Lock size={10} />
                              <span>Đã khóa</span>
                            </>
                          )}
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
    </div>
  );
}
