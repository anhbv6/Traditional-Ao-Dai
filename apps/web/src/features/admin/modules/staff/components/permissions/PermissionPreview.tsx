"use client";

import { Ban, Eye, LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminFilterSelect } from "@/features/admin/core/ui";
import { getAdminNavEntries, type AdminNavLink } from "@/features/admin/core/layout";
import { ADMIN_ACTION_ACCESS, ADMIN_MODULE_ACCESS, canAccess, type AdminModule, type Permission } from "../../../../core/session/permissions";
import { type StaffRow } from "../../types/staff.types";

/** Khối ở màn Tổng quan và quyền mở nó (AGENTS.md §8 — mỗi khối theo quyền) */
const DASHBOARD_BLOCKS = [
  { key: "revenue", rule: ADMIN_ACTION_ACCESS.viewReports },
  { key: "inventory", rule: ADMIN_ACTION_ACCESS.manageInventory },
  { key: "tailoring", rule: ADMIN_ACTION_ACCESS.updateTailoring },
  { key: "orders", rule: ADMIN_ACTION_ACCESS.viewDashboardOrders },
] as const;

/** Màn chỉ Super Admin vào được — suy từ ADMIN_MODULE_ACCESS, không gõ tay */
const ADMIN_ONLY_MODULES = (Object.entries(ADMIN_MODULE_ACCESS) as [AdminModule, (typeof ADMIN_MODULE_ACCESS)[AdminModule]][])
  .filter(([, rule]) => rule.role === "ADMIN")
  .map(([module]) => module);

/**
 * "Xem như nhân viên": menu trái và các khối Tổng quan người được chọn sẽ thấy với bộ quyền ĐANG SOẠN (chưa lưu cũng
 * thấy), đánh dấu màn mới mở / bị mất so với hiện tại. Dùng đúng getAdminNavEntries + canAccess của menu thật.
 */
export function PermissionPreview({
  staff,
  selectedId,
  onSelect,
  draftOf,
  className,
}: {
  staff: StaffRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Bộ quyền đang soạn của một người */
  draftOf: (member: StaffRow) => Permission[];
  className?: string;
}) {
  const t = useTranslations("AdminPage.rolePermissions");
  const tStaff = useTranslations("AdminPage.staff");
  const tNav = useTranslations("AdminPage.nav");
  const member = staff.find((item) => item.id === selectedId) ?? staff[0];

  if (!member) return null;

  const nameOf = (item: StaffRow) => item.name || item.email || tStaff("unnamed");
  const draft = { role: "STAFF", permissions: draftOf(member) };
  const current = { role: "STAFF", permissions: member.permissions };
  const entries = getAdminNavEntries(null, draft, (key) => tNav(key));
  const currentKeys = new Set(
    getAdminNavEntries(null, current, (key) => tNav(key)).flatMap((entry) => (entry.type === "group" ? entry.children.map((child) => child.key) : [entry.key]))
  );
  const draftKeys = new Set(entries.flatMap((entry) => (entry.type === "group" ? entry.children.map((child) => child.key) : [entry.key])));
  const lost = [...currentKeys].filter((key) => !draftKeys.has(key));

  const mark = (link: AdminNavLink) =>
    !currentKeys.has(link.key) ? <span className="ml-auto rounded bg-emerald-50 px-1.5 text-2xs font-medium text-emerald-700">{t("preview.new")}</span> : null;

  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5", className)}>
      <header className="mb-3 flex items-center gap-2">
        <Eye size={18} className="text-[#71717A]" aria-hidden />
        <h2 className="text-lg font-semibold text-[#09090B]">{t("preview.title")}</h2>
      </header>
      <AdminFilterSelect
        label={t("preview.as")}
        value={member.id}
        onChange={onSelect}
        options={staff.map((item) => ({ value: item.id, label: nameOf(item) }))}
        className="mb-4 w-full"
      />
      {member.status === "LOCKED" && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{t("preview.locked")}</p>}

      {/* Menu trái thu nhỏ */}
      <p className="mb-1.5 text-xs font-medium text-[#71717A]">{t("preview.menu", { count: draftKeys.size })}</p>
      <nav aria-label={t("preview.menuLabel", { name: nameOf(member) })} className="rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-2 text-sm">
        <ul className="space-y-0.5">
          {entries.map((entry) => {
            const Icon = entry.icon ?? LayoutDashboard;
            return entry.type === "group" ? (
              <li key={entry.key}>
                <p className="flex items-center gap-2 px-2 pb-0.5 pt-2 text-xs font-medium text-[#71717A]">
                  <Icon size={13} aria-hidden /> {entry.label}
                </p>
                <ul>
                  {entry.children.map((child) => (
                    <li key={child.key} className="flex items-center gap-2 rounded-md py-1 pl-7 pr-2 text-[#3F3F46]">
                      {child.label}
                      {mark(child)}
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={entry.key} className="flex items-center gap-2 rounded-md px-2 py-1 text-[#3F3F46]">
                <Icon size={13} aria-hidden /> {entry.label}
                {mark(entry)}
              </li>
            );
          })}
        </ul>
      </nav>
      {lost.length > 0 && (
        <p className="mt-2 text-xs text-rose-700">{t("preview.lost", { names: lost.map((key) => tNav(key)).join(", ") })}</p>
      )}

      {/* Khối ở Tổng quan */}
      <p className="mb-1.5 mt-4 text-xs font-medium text-[#71717A]">{t("preview.dashboard")}</p>
      <ul className="grid grid-cols-2 gap-1.5">
        {DASHBOARD_BLOCKS.map((block) => {
          const visible = canAccess(draft, block.rule);
          return (
            <li
              key={block.key}
              className={cn("rounded-lg border px-2.5 py-1.5 text-xs", visible ? "border-[#E4E4E7] bg-white text-[#3F3F46]" : "border-dashed border-[#E4E4E7] text-[#A1A1AA] line-through")}
            >
              {t(`preview.block.${block.key}`)}
            </li>
          );
        })}
      </ul>

      {/* Không bao giờ thấy — giới hạn cứng của vai trò STAFF */}
      <div className="mt-4 border-t border-dashed border-[#E4E4E7] pt-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#71717A]">
          <Ban size={13} aria-hidden /> {t("preview.adminOnly")}
        </p>
        <p className="text-xs leading-relaxed text-[#A1A1AA]">
          {[...ADMIN_ONLY_MODULES.map((module) => tNav(module)), t("preview.lockCustomers"), t("preview.reviewApprovals")].join(" · ")}
        </p>
      </div>
    </section>
  );
}
