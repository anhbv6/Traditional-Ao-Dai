"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Eye, MoreHorizontal, RotateCcw, ShieldCheck, ShieldOff, ShieldPlus, UserRound, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { useNotify } from "@/hooks/useNotify";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_ROW_ICON_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminCheckbox,
  AdminDataTable,
  AdminDialog,
  AdminFilterSelect,
  AdminInfoTip,
  AdminListPanel,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { STAFF_PERMISSIONS, type Permission } from "../../../../core/session/permissions";
import { updateStaffPermissionsBatchAction } from "../../actions/staff.actions";
import { type RolePermissionsData, type StaffRow } from "../../types/staff.types";
import { modulesForPermission } from "../../utils/permissionScope";
import { ROLE_TEMPLATES, matchTemplate, normalizePermissions, samePermissions } from "../../utils/roleTemplates";
import { StaffAvatar } from "../shared/StaffParts";
import { PermissionHistory } from "./PermissionHistory";
import { PermissionPreview } from "./PermissionPreview";

type RowFilter = "ALL" | "CHANGED" | "NONE" | "LOCKED";

/**
 * Cấu hình › Phân quyền. Không lưu từng ô: tick / áp vai trò mẫu chỉ đổi bản nháp (ô đổi được tô + / −), xem lại rồi lưu
 * một lần (transaction, mỗi người một dòng AuditLog). Cột phải "Xem như" cho thấy menu và khối Tổng quan người được chọn
 * sẽ có với bộ quyền đang soạn; dưới cùng là lịch sử đổi quyền. Super Admin luôn toàn quyền nên không nằm trong bảng.
 */
export function RolePermissionsBoard({ data }: { data: RolePermissionsData }) {
  const t = useTranslations("AdminPage.rolePermissions");
  const tStaff = useTranslations("AdminPage.staff");
  const tPage = useTranslations("AdminPage.pages.rolePermissions");
  const tNav = useTranslations("AdminPage.nav");
  const notify = useNotify();
  const router = useRouter();

  const [drafts, setDrafts] = useState<Record<string, Permission[]>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RowFilter>("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(data.staff[0]?.id ?? null);
  const [reviewing, setReviewing] = useState(false);

  const draftOf = (member: StaffRow) => drafts[member.id] ?? member.permissions;
  const isChanged = (member: StaffRow) => member.id in drafts && !samePermissions(drafts[member.id]!, member.permissions);
  const changed = data.staff.filter(isChanged);
  const nameOf = (member: StaffRow) => member.name || member.email || tStaff("unnamed");

  const setDraft = (member: StaffRow, permissions: Permission[]) =>
    setDrafts((current) => {
      const next = { ...current };
      // Trở về đúng như đã lưu thì bỏ khỏi nháp — số "thay đổi" luôn phản ánh thật
      if (samePermissions(permissions, member.permissions)) delete next[member.id];
      else next[member.id] = normalizePermissions(permissions);
      return next;
    });
  const toggle = (member: StaffRow, permission: Permission, checked: boolean) => {
    const current = draftOf(member);
    setDraft(member, checked ? [...current, permission] : current.filter((item) => item !== permission));
  };

  const keyword = search.trim().toLowerCase();
  const rows = data.staff.filter((member) => {
    if (keyword && ![member.name ?? "", member.email ?? ""].some((value) => value.toLowerCase().includes(keyword))) return false;
    if (filter === "CHANGED") return isChanged(member);
    if (filter === "NONE") return draftOf(member).length === 0;
    if (filter === "LOCKED") return member.status === "LOCKED";
    return true;
  });

  // Quyền không còn ai (đang hoạt động) giữ theo bản nháp → việc đó sẽ dồn hết về Super Admin
  const active = data.staff.filter((member) => member.status === "ACTIVE");
  const holders = (permission: Permission) => active.filter((member) => draftOf(member).includes(permission)).length;
  const orphaned = active.length > 0 ? STAFF_PERMISSIONS.filter((permission) => holders(permission) === 0) : [];

  const save = useMutation({
    mutationFn: () => updateStaffPermissionsBatchAction({ changes: changed.map((member) => ({ userId: member.id, permissions: draftOf(member) })) }),
    onSuccess: (res) => {
      if (!res.success) return notify.error(res.error, "STAFF_PERMISSION_UPDATE_FAILED");
      notify.success(t("toast.saved", { count: res.data.length }));
      setReviewing(false);
      setDrafts({});
      router.refresh();
    },
    onError: () => notify.error("STAFF_PERMISSION_UPDATE_FAILED"),
  });

  const templateItems = (apply: (permissions: Permission[]) => void): AppMenuEntry[] =>
    ROLE_TEMPLATES.map((template) => ({
      key: `tpl-${template.key}`,
      label: t(`template.${template.key}.name`),
      description: template.permissions.map((permission) => tStaff(`permissionShort.${permission}`)).join(" · "),
      icon: Wand2,
      onSelect: () => apply([...template.permissions]),
    }));

  const rowMenu = (member: StaffRow): AppMenuEntry[] => [
    { key: "preview", label: t("menu.preview"), icon: Eye, onSelect: () => setPreviewId(member.id) },
    { key: "profile", label: t("menu.profile"), icon: UserRound, href: `/admin/staff/${member.id}` },
    { type: "label", key: "tpl-label", label: t("menu.applyTemplate") },
    ...templateItems((permissions) => setDraft(member, permissions)),
    { type: "separator", key: "sep" },
    { key: "all", label: t("menu.grantAll"), icon: ShieldPlus, onSelect: () => setDraft(member, [...STAFF_PERMISSIONS]) },
    { key: "none", label: t("menu.revokeAll"), icon: ShieldOff, tone: "danger", onSelect: () => setDraft(member, []) },
    ...(isChanged(member) ? [{ key: "reset", label: t("menu.reset"), icon: RotateCcw, onSelect: () => setDraft(member, member.permissions) } satisfies AppMenuEntry] : []),
  ];

  const scope = (permission: Permission) => {
    const modules = modulesForPermission(permission);
    return modules.length > 0 ? modules.map((module) => tNav(module)).join(", ") : tStaff("detail.opensReports");
  };

  const memberCell = (member: StaffRow) => {
    const draft = draftOf(member);
    const template = matchTemplate(draft);
    return (
      <div className="flex min-w-0 items-center gap-3">
        <StaffAvatar name={nameOf(member)} muted={member.status === "LOCKED"} />
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setPreviewId(member.id)}
            className={cn("block max-w-full cursor-pointer truncate text-left font-medium hover:underline", previewId === member.id ? "text-[#09090B] underline decoration-dotted underline-offset-4" : "text-[#09090B]")}
          >
            {nameOf(member)}
          </button>
          <p className="mt-0.5 truncate text-xs text-[#71717A]">
            {member.status === "LOCKED" && <span className="text-rose-600">{t("row.locked")} · </span>}
            {draft.length === 0 ? (
              <span className="text-amber-700">{t("row.none")}</span>
            ) : template ? (
              t("row.template", { name: t(`template.${template}.name`) })
            ) : (
              t("row.custom", { count: draft.length })
            )}
            {isChanged(member) && <span className="text-[#09090B]"> · {t("row.changed")}</span>}
          </p>
        </div>
      </div>
    );
  };

  /** Ô quyền: nền xanh = sắp cấp thêm, nền đỏ = sắp thu hồi (chưa lưu) */
  const permissionCell = (member: StaffRow, permission: Permission) => {
    const now = draftOf(member).includes(permission);
    const was = member.permissions.includes(permission);
    return (
      <span className={cn("mx-auto flex size-9 items-center justify-center rounded-lg", now && !was && "bg-emerald-50 ring-1 ring-emerald-200", !now && was && "bg-rose-50 ring-1 ring-rose-200")}>
        <AdminCheckbox
          checked={now}
          disabled={save.isPending}
          onChange={(checked) => toggle(member, permission, checked)}
          label={`${tStaff(`permissions.${permission}`)} — ${nameOf(member)}`}
        />
      </span>
    );
  };

  const columns: AdminTableColumn<StaffRow>[] = [
    { key: "member", header: tStaff("columns.staff"), cell: memberCell },
    ...STAFF_PERMISSIONS.map((permission) => ({
      key: permission,
      header: (
        <span className="flex flex-col items-center gap-0.5 whitespace-normal leading-tight">
          <span className="inline-flex items-center gap-1 text-sm">
            {tStaff(`permissionShort.${permission}`)}
            <AdminInfoTip content={`${tStaff("detail.opens")} ${scope(permission)}`} />
          </span>
          <span className={cn("font-mono text-2xs font-normal", holders(permission) === 0 ? "text-rose-600" : "text-[#A1A1AA]")}>
            {t("column.holders", { count: holders(permission), total: active.length })}
          </span>
        </span>
      ),
      className: "w-24 text-center",
      cell: (member: StaffRow) => permissionCell(member, permission),
    })),
  ];

  return (
    <>
      <AdminListPanel
        icon={ShieldCheck}
        title={tPage("title")}
        description={tPage("description")}
        filters={
          <AdminFilterSelect<RowFilter>
            label={t("filter.label")}
            value={filter}
            onChange={setFilter}
            options={(["ALL", "CHANGED", "NONE", "LOCKED"] as const).map((value) => ({ value, label: t(`filter.${value}`) }))}
          />
        }
        search={{ value: search, onChange: setSearch, placeholder: tStaff("searchPlaceholder") }}
      />

      <div className="@container">
        <div className="grid items-start gap-5 @5xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-3">
            {orphaned.length > 0 && (
              <div className={cn(ADMIN_CARD_CLASS, "flex items-start gap-2.5 border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900")}>
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
                <p>{t("orphaned", { names: orphaned.map((permission) => tStaff(`permissionShort.${permission}`)).join(", ") })}</p>
              </div>
            )}

            <AdminDataTable
              rows={rows}
              columns={columns}
              getRowId={(member) => member.id}
              minWidth={720}
              activeRowId={previewId}
              actionsLabel={t("column.actions")}
              empty={data.staff.length === 0 ? tStaff("empty.title") : tStaff("noResults")}
              selection={{
                selectedIds: selected,
                onChange: setSelected,
                selectAllLabel: t("bulk.selectAll"),
                rowLabel: (member) => nameOf(member),
                summary: (count) => t("bulk.summary", { count }),
                actions: (
                  <>
                    <AppMenu
                      tone="admin"
                      width={260}
                      align="end"
                      items={templateItems((permissions) => {
                        data.staff.filter((member) => selected.has(member.id)).forEach((member) => setDraft(member, permissions));
                        setSelected(new Set());
                      })}
                      trigger={
                        <button type="button" className={ADMIN_SECONDARY_BUTTON_CLASS}>
                          <Wand2 size={15} aria-hidden /> {t("bulk.template")}
                        </button>
                      }
                    />
                    <button
                      type="button"
                      onClick={() => {
                        data.staff.filter((member) => selected.has(member.id)).forEach((member) => setDraft(member, []));
                        setSelected(new Set());
                      }}
                      className={ADMIN_SECONDARY_BUTTON_CLASS}
                    >
                      <ShieldOff size={15} aria-hidden /> {t("bulk.revoke")}
                    </button>
                  </>
                ),
              }}
              rowActions={(member) => (
                <AppMenu
                  tone="admin"
                  width={260}
                  align="end"
                  items={rowMenu(member)}
                  trigger={
                    <button type="button" aria-label={t("menu.label", { name: nameOf(member) })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
                      <MoreHorizontal size={18} />
                    </button>
                  }
                />
              )}
              mobileRow={(member) => (
                <div className="space-y-3">
                  {memberCell(member)}
                  <ul className="grid grid-cols-2 gap-1.5">
                    {STAFF_PERMISSIONS.map((permission) => {
                      const now = draftOf(member).includes(permission);
                      const was = member.permissions.includes(permission);
                      return (
                        <li key={permission}>
                          <label
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm text-[#3F3F46]",
                              now && !was ? "border-emerald-200 bg-emerald-50" : !now && was ? "border-rose-200 bg-rose-50" : "border-[#E4E4E7]"
                            )}
                          >
                            <AdminCheckbox checked={now} onChange={(checked) => toggle(member, permission, checked)} label={tStaff(`permissions.${permission}`)} />
                            <span className="leading-tight">{tStaff(`permissionShort.${permission}`)}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            />
            <p className="px-1 text-xs text-[#71717A]">{t("note")}</p>
          </div>

          <PermissionPreview staff={data.staff} selectedId={previewId} onSelect={setPreviewId} draftOf={draftOf} className="@5xl:sticky @5xl:top-6" />
        </div>
      </div>

      <PermissionHistory history={data.history} />

      {/* Thanh lưu: chỉ hiện khi có người đổi quyền */}
      {changed.length > 0 && (
        <div className="sticky bottom-4 z-20">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-3 rounded-2xl border border-[#E4E4E7] bg-white/95 px-4 py-3 shadow-[0_16px_40px_-20px_rgba(9,9,11,0.45)] backdrop-blur">
            <span className="mr-auto text-sm text-[#3F3F46]">{t("bar.summary", { count: changed.length })}</span>
            <button type="button" onClick={() => setDrafts({})} className={ADMIN_SECONDARY_BUTTON_CLASS}>
              {t("bar.discard")}
            </button>
            <button type="button" onClick={() => setReviewing(true)} className={ADMIN_PRIMARY_BUTTON_CLASS}>
              {t("bar.review")}
            </button>
          </div>
        </div>
      )}

      {reviewing && (
        <AdminDialog
          open
          onOpenChange={(open) => !open && !save.isPending && setReviewing(false)}
          icon={ShieldCheck}
          title={t("review.title", { count: changed.length })}
          description={t("review.description")}
          size="lg"
          footer={
            <>
              <button type="button" disabled={save.isPending} onClick={() => setReviewing(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
                {t("review.back")}
              </button>
              <button type="button" disabled={save.isPending} onClick={() => save.mutate()} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
                {save.isPending ? t("review.saving") : t("review.confirm")}
              </button>
            </>
          }
        >
          <ul className="divide-y divide-dashed divide-[#E4E4E7]">
            {changed.map((member) => {
              const draft = draftOf(member);
              const added = draft.filter((permission) => !member.permissions.includes(permission));
              const removed = member.permissions.filter((permission) => !draft.includes(permission));
              return (
                <li key={member.id} className="flex items-start gap-3 py-3 first:pt-0">
                  <StaffAvatar name={nameOf(member)} muted={member.status === "LOCKED"} />
                  <div className="min-w-0">
                    <Link href={`/admin/staff/${member.id}`} className="font-medium text-[#09090B] hover:underline">
                      {nameOf(member)}
                    </Link>
                    <p className="mt-1 flex flex-wrap gap-1.5">
                      {added.map((permission) => (
                        <span key={permission} className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                          + {tStaff(`permissions.${permission}`)}
                        </span>
                      ))}
                      {removed.map((permission) => (
                        <span key={permission} className="rounded-md bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-700">
                          − {tStaff(`permissions.${permission}`)}
                        </span>
                      ))}
                    </p>
                    {draft.length === 0 && <p className="mt-1 text-xs text-amber-700">{t("review.becomesEmpty")}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 rounded-lg bg-[#FAFAFA] px-3 py-2 text-xs leading-relaxed text-[#52525B]">{t("review.effect")}</p>
        </AdminDialog>
      )}
    </>
  );
}
