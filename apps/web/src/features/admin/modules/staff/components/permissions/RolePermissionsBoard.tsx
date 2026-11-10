"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  AdminCheckbox,
  AdminDataTable,
  AdminInfoTip,
  AdminListPanel,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { STAFF_PERMISSIONS, type Permission } from "../../../../core/session/permissions";
import { useStaffActions } from "../../hooks/useStaffActions";
import { type StaffBoardData, type StaffRow } from "../../types/staff.types";
import { modulesForPermission } from "../../utils/permissionScope";
import { StaffAvatar } from "../shared/StaffParts";

/**
 * Cấu hình › Phân quyền: bảng nhân viên × quyền chi tiết. Tiêu đề mỗi cột có ⓘ liệt kê các màn quyền đó mở
 * (suy từ ADMIN_MODULE_ACCESS). Super Admin luôn có toàn quyền nên không nằm trong bảng.
 */
export function RolePermissionsBoard({ data }: { data: StaffBoardData }) {
  const t = useTranslations("AdminPage.staff");
  const tPage = useTranslations("AdminPage.pages.rolePermissions");
  const tNav = useTranslations("AdminPage.nav");
  const [search, setSearch] = useState("");
  const [patches, setPatches] = useState<Record<string, Permission[]>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { setPermissions } = useStaffActions((patch) => {
    if ("permissions" in patch) setPatches((prev) => ({ ...prev, [patch.id]: patch.permissions }));
  });

  const staff = data.staff.map((member) => ({ ...member, permissions: patches[member.id] ?? member.permissions }));
  const keyword = search.trim().toLowerCase();
  const rows = staff.filter(
    (member) => !keyword || [member.name ?? "", member.email ?? ""].some((value) => value.toLowerCase().includes(keyword))
  );
  const nameOf = (member: StaffRow) => member.name || member.email || t("unnamed");

  const toggle = (member: StaffRow, permission: Permission, checked: boolean) => {
    setPendingId(member.id);
    setPermissions.mutate(
      {
        userId: member.id,
        permissions: checked ? [...member.permissions, permission] : member.permissions.filter((item) => item !== permission),
      },
      { onSettled: () => setPendingId(null) }
    );
  };

  const scope = (permission: Permission) => {
    const modules = modulesForPermission(permission);
    return modules.length > 0 ? modules.map((module) => tNav(module)).join(", ") : t("detail.opensReports");
  };

  const columns: AdminTableColumn<StaffRow>[] = [
    {
      key: "member",
      header: t("columns.staff"),
      cell: (member) => (
        <div className="flex min-w-0 items-center gap-3">
          <StaffAvatar name={nameOf(member)} muted={member.status === "LOCKED"} />
          <div className="min-w-0">
            <Link href={`/admin/staff/${member.id}`} className="block truncate font-medium text-[#09090B] hover:underline">
              {nameOf(member)}
            </Link>
            <p className="mt-0.5 text-xs text-[#71717A]">{t("permissionCount", { count: member.permissions.length })}</p>
          </div>
        </div>
      ),
    },
    ...STAFF_PERMISSIONS.map((permission) => ({
      key: permission,
      header: (
        <span className="inline-flex items-center gap-1 whitespace-normal text-sm leading-tight">
          {t(`permissionShort.${permission}`)}
          <AdminInfoTip content={`${t("detail.opens")} ${scope(permission)}`} />
        </span>
      ),
      className: "w-28 text-center",
      cell: (member: StaffRow) => (
        <span className="flex justify-center">
          <AdminCheckbox
            checked={member.permissions.includes(permission)}
            disabled={pendingId === member.id}
            onChange={(checked) => toggle(member, permission, checked)}
            label={`${t(`permissions.${permission}`)} — ${nameOf(member)}`}
          />
        </span>
      ),
    })),
  ];

  return (
    <>
      <AdminListPanel
        icon={ShieldCheck}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
      />

      <p className="text-xs text-[#71717A]">{t("matrix.adminNote")}</p>

      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(member) => member.id}
        minWidth={760}
        empty={data.staff.length === 0 ? t("empty.title") : t("noResults")}
        mobileRow={(member) => (
          <div className="space-y-3">
            <p className="font-medium text-[#09090B]">{nameOf(member)}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {STAFF_PERMISSIONS.map((permission) => (
                <li key={permission} className="flex items-center gap-2 text-sm text-[#3F3F46]">
                  <AdminCheckbox
                    checked={member.permissions.includes(permission)}
                    disabled={pendingId === member.id}
                    onChange={(checked) => toggle(member, permission, checked)}
                    label={t(`permissions.${permission}`)}
                  />
                  {t(`permissions.${permission}`)}
                </li>
              ))}
            </ul>
          </div>
        )}
      />
    </>
  );
}
