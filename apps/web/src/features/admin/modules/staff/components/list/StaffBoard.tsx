"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Eye, KeyRound, Lock, LockOpen, MoreHorizontal, ShieldCheck, UserCog } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_ROW_ICON_BUTTON_CLASS,
  AdminDataTable,
  AdminFilterSelect,
  AdminListPanel,
  AdminStatusText,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { useStaffActions } from "../../hooks/useStaffActions";
import { type StaffBoardData, type StaffRow } from "../../types/staff.types";
import { LockStaffDialog, PermissionSummary, StaffAvatar } from "../shared/StaffParts";

const CreateStaffDialog = dynamic(() => import("../shared/CreateStaffDialog").then((m) => m.CreateStaffDialog));
const ResetStaffPasswordDialog = dynamic(() => import("../shared/ResetStaffPasswordDialog").then((m) => m.ResetStaffPasswordDialog));

type StatusFilter = "ALL" | "ACTIVE" | "LOCKED" | "NO_PERMISSION";

/**
 * Màn Nhân sự = danh sách người: liên hệ, quyền tóm tắt một dòng, hoạt động (đăng nhập gần nhất, số thao tác 30 ngày),
 * trạng thái. Sửa quyền ở hồ sơ từng người hoặc cả bảng ở Cấu hình › Phân quyền — màn này không còn là bảng tick quyền.
 */
export function StaffBoard({ data }: { data: StaffBoardData }) {
  const t = useTranslations("AdminPage.staff");
  const tPage = useTranslations("AdminPage.pages.staff");
  const format = useFormatter();
  const router = useRouter();
  // Danh sách đọc thẳng từ server (thêm nhân viên → router.refresh); thay đổi vừa làm áp tạm cho tới khi server trả về
  const [patches, setPatches] = useState<Record<string, Partial<StaffRow>>>({});
  const staff = data.staff.map((member) => ({ ...member, ...patches[member.id] }));
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [creating, setCreating] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffRow | null>(null);
  const [lockTarget, setLockTarget] = useState<StaffRow | null>(null);

  const { setActive } = useStaffActions((patch) => {
    setPatches((prev) => ({ ...prev, [patch.id]: { ...prev[patch.id], ...patch } }));
    setLockTarget(null);
  });

  const nameOf = (member: StaffRow) => member.name || member.email || t("unnamed");
  const relative = (iso: string) => format.relativeTime(new Date(iso), new Date(data.now));
  const keyword = search.trim().toLowerCase();
  const rows = staff.filter(
    (member) =>
      (!keyword || [member.name ?? "", member.email ?? "", member.phone ?? ""].some((value) => value.toLowerCase().includes(keyword))) &&
      (status === "ALL" ||
        (status === "NO_PERMISSION" ? member.permissions.length === 0 : member.status === status))
  );

  const menuItems = (member: StaffRow): AppMenuEntry[] => [
    { key: "view", label: t("menu.view"), icon: Eye, href: `/admin/staff/${member.id}` },
    { key: "reset", label: t("resetPassword"), icon: KeyRound, onSelect: () => setResetTarget(member) },
    ...(member.id !== data.currentUserId
      ? [
          { type: "separator" as const, key: "sep" },
          {
            key: "lock",
            label: member.status === "LOCKED" ? t("menu.unlock") : t("menu.lock"),
            icon: member.status === "LOCKED" ? LockOpen : Lock,
            tone: member.status === "LOCKED" ? ("default" as const) : ("danger" as const),
            onSelect: () => setLockTarget(member),
          },
        ]
      : []),
  ];

  const memberCell = (member: StaffRow) => (
    <div className="flex min-w-0 items-center gap-3">
      <StaffAvatar name={nameOf(member)} muted={member.status === "LOCKED"} />
      <div className="min-w-0">
        <Link href={`/admin/staff/${member.id}`} className="block truncate font-medium text-[#09090B] hover:underline">
          {nameOf(member)}
        </Link>
        <p className="mt-0.5 truncate text-xs text-[#71717A]">
          {[member.email, member.phone].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );

  const activityCell = (member: StaffRow) => (
    <div className="whitespace-nowrap">
      <p className="text-[#09090B]">{member.lastLoginAt ? t("lastLogin", { time: relative(member.lastLoginAt) }) : t("neverLoggedIn")}</p>
      <p className="mt-0.5 text-xs text-[#71717A]">{t("activity30d", { count: member.activity30d })}</p>
    </div>
  );

  const statusCell = (member: StaffRow) => (
    <AdminStatusText tone={member.status === "LOCKED" ? "danger" : "success"}>
      {member.status === "LOCKED" ? t("locked") : t("active")}
    </AdminStatusText>
  );

  const columns: AdminTableColumn<StaffRow>[] = [
    { key: "member", header: t("columns.staff"), cell: memberCell },
    {
      key: "permissions",
      header: t("columns.permissions"),
      className: "hidden @3xl:table-cell",
      cell: (member) => <PermissionSummary permissions={member.permissions} className="text-sm" />,
    },
    { key: "activity", header: t("columns.activity"), className: "w-48", cell: activityCell },
    { key: "status", header: t("columns.status"), className: "hidden w-32 @2xl:table-cell", cell: statusCell },
  ];

  return (
    <>
      <AdminListPanel
        icon={UserCog}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("create"), onClick: () => setCreating(true) }}
        filters={
          <AdminFilterSelect
            label={t("filter.status")}
            value={status}
            onChange={setStatus}
            options={(["ALL", "ACTIVE", "LOCKED", "NO_PERMISSION"] as const).map((value) => ({ value, label: t(`filter.option.${value}`) }))}
            className="w-full sm:w-60"
          />
        }
      />

      {/* Lối sang màn phân quyền — quyền được quản lý ở đó, màn này chỉ tóm tắt */}
      <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-[#71717A]">
        <ShieldCheck size={13} aria-hidden />
        {t("permissionsHint")}
        <Link href="/admin/settings/permissions" className="font-medium text-[#09090B] hover:underline">
          {t("permissionsLink")}
        </Link>
      </p>

      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(member) => member.id}
        rowActions={(member) => (
          <AppMenu
            tone="admin"
            width={232}
            align="end"
            sideOffset={4}
            items={menuItems(member)}
            trigger={
              <button type="button" aria-label={t("menu.label", { name: nameOf(member) })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
                <MoreHorizontal size={18} />
              </button>
            }
          />
        )}
        actionsLabel={t("columns.actions")}
        minWidth={480}
        empty={staff.length === 0 ? t("empty.title") : t("noResults")}
        mobileRow={(member) => (
          <div className="space-y-2">
            {memberCell(member)}
            <div className="space-y-1 pl-12 text-xs">
              <PermissionSummary permissions={member.permissions} />
              <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[#71717A]")}>
                {statusCell(member)}
                <span>{member.lastLoginAt ? t("lastLogin", { time: relative(member.lastLoginAt) }) : t("neverLoggedIn")}</span>
              </div>
            </div>
          </div>
        )}
      />

      {creating && <CreateStaffDialog open onOpenChange={setCreating} onCreated={() => router.refresh()} />}
      {resetTarget && <ResetStaffPasswordDialog staff={resetTarget} onClose={() => setResetTarget(null)} />}
      {lockTarget && (
        <LockStaffDialog
          name={nameOf(lockTarget)}
          locking={lockTarget.status !== "LOCKED"}
          pending={setActive.isPending}
          onOpenChange={(open) => !open && setLockTarget(null)}
          onConfirm={() => setActive.mutate({ userId: lockTarget.id, isActive: lockTarget.status === "LOCKED" })}
        />
      )}
    </>
  );
}
