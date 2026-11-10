"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { KeyRound, Lock, LockOpen, Scissors } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDetailHeader,
  AdminStatusText,
  AdminSwitch,
} from "@/features/admin/core/ui";
import { STAFF_PERMISSIONS } from "../../../../core/session/permissions";
import { useStaffActions } from "../../hooks/useStaffActions";
import { type StaffDetailData } from "../../types/staff.types";
import { modulesForPermission } from "../../utils/permissionScope";
import { LockStaffDialog, StaffAvatar } from "../shared/StaffParts";

const ResetStaffPasswordDialog = dynamic(() => import("../shared/ResetStaffPasswordDialog").then((m) => m.ResetStaffPasswordDialog));

const SHOP_TIME_ZONE = "Asia/Ho_Chi_Minh";

function Card({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#09090B]">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-[#71717A]">{label}</span>
      <span className="min-w-0 break-all text-right text-[#09090B]">{children}</span>
    </div>
  );
}

/**
 * Hồ sơ nhân viên: quyền của riêng người này (công tắc, mỗi quyền ghi rõ mở những màn nào), hoạt động gần đây
 * (thao tác quản trị + cập nhật xưởng), cột phải thông tin tài khoản. Đặt lại mật khẩu / khóa ở thanh đầu.
 */
export function StaffDetail({ data, isSelf }: { data: StaffDetailData; isSelf: boolean }) {
  const t = useTranslations("AdminPage.staff");
  const tNav = useTranslations("AdminPage.nav");
  const tTailoring = useTranslations("AdminPage.tailoring");
  const format = useFormatter();
  const [member, setMember] = useState(data);
  const [resetOpen, setResetOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const { setPermissions, setActive } = useStaffActions((patch) => {
    setMember((prev) => ({ ...prev, ...patch }));
    setLockOpen(false);
  });

  const name = member.name || member.email || t("unnamed");
  const locked = member.status === "LOCKED";
  const relative = (iso: string) => format.relativeTime(new Date(iso), new Date(member.now));
  const day = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "numeric", year: "numeric", timeZone: SHOP_TIME_ZONE });
  const activityLabel = (activity: StaffDetailData["activities"][number]) =>
    activity.source === "TAILORING"
      ? t("activity.tailoring", { stage: tTailoring.has(`stage.${activity.action}`) ? tTailoring(`stage.${activity.action}`) : activity.action })
      : t.has(`activity.audit.${activity.action}`)
        ? t(`activity.audit.${activity.action}`)
        : activity.action;

  return (
    <>
      <AdminDetailHeader
        backHref="/admin/staff"
        backLabel={t("detail.back")}
        title={name}
        icon={<StaffAvatar name={name} size="lg" muted={locked} />}
        badge={<AdminStatusText tone={locked ? "danger" : "success"}>{locked ? t("locked") : t("active")}</AdminStatusText>}
        subtitle={[member.email, member.phone].filter(Boolean).join(" · ")}
        actions={
          <>
            <button type="button" onClick={() => setResetOpen(true)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
              <KeyRound size={15} aria-hidden /> {t("resetPassword")}
            </button>
            {!isSelf && (
              <button type="button" onClick={() => setLockOpen(true)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                {locked ? <LockOpen size={15} aria-hidden /> : <Lock size={15} aria-hidden />}
                {locked ? t("menu.unlock") : t("menu.lock")}
              </button>
            )}
          </>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Card
            title={t("detail.permissions")}
            aside={
              <Link href="/admin/settings/permissions" className="text-xs font-medium text-[#71717A] hover:text-[#09090B] hover:underline">
                {t("detail.allPermissions")}
              </Link>
            }
          >
            <ul className="divide-y divide-dashed divide-[#E4E4E7]">
              {STAFF_PERMISSIONS.map((permission) => {
                const granted = member.permissions.includes(permission);
                return (
                  <li key={permission} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className={cn("text-body font-medium", granted ? "text-[#09090B]" : "text-[#71717A]")}>{t(`permissions.${permission}`)}</p>
                      <p className="mt-0.5 text-xs text-[#71717A]">
                        {t("detail.opens")} {modulesForPermission(permission).map((module) => tNav(module)).join(", ") || t("detail.opensReports")}
                      </p>
                    </div>
                    <AdminSwitch
                      checked={granted}
                      disabled={setPermissions.isPending}
                      label={t(`permissions.${permission}`)}
                      onChange={(checked) =>
                        setPermissions.mutate({
                          userId: member.id,
                          permissions: checked ? [...member.permissions, permission] : member.permissions.filter((item) => item !== permission),
                        })
                      }
                    />
                  </li>
                );
              })}
            </ul>
            {member.permissions.length === 0 && <p className="mt-4 text-xs text-amber-700">{t("detail.noPermissionsHint")}</p>}
          </Card>

          <Card title={t("detail.activity")} aside={<span className="text-xs text-[#71717A]">{t("activity30d", { count: member.activity30d })}</span>}>
            {member.activities.length === 0 ? (
              <p className="text-sm text-[#A1A1AA]">{t("detail.noActivity")}</p>
            ) : (
              <ol className="space-y-3">
                {member.activities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3 text-sm">
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#A1A1AA]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[#09090B]">
                        {activity.source === "TAILORING" && <Scissors size={12} className="mr-1 inline text-[#71717A]" aria-hidden />}
                        {activityLabel(activity)}
                        {activity.reference && <span className="ml-1.5 font-mono text-2xs text-[#71717A]">{activity.reference}</span>}
                      </p>
                    </div>
                    <time dateTime={activity.createdAt} className="shrink-0 text-xs text-[#A1A1AA]">
                      {relative(activity.createdAt)}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <Card title={t("detail.account")}>
            <div className="space-y-2.5">
              <InfoRow label={t("detail.email")}>{member.email ?? "—"}</InfoRow>
              <InfoRow label={t("detail.phone")}>{member.phone ? <span className="font-mono text-xs">{member.phone}</span> : "—"}</InfoRow>
              <InfoRow label={t("detail.createdAt")}>{day(member.createdAt)}</InfoRow>
              <InfoRow label={t("detail.lastLogin")}>{member.lastLoginAt ? relative(member.lastLoginAt) : t("neverLoggedIn")}</InfoRow>
              <InfoRow label={t("detail.lastActivity")}>{member.lastActivityAt ? relative(member.lastActivityAt) : "—"}</InfoRow>
              <InfoRow label={t("detail.sessions")}>{member.activeSessions}</InfoRow>
            </div>
          </Card>
        </aside>
      </div>

      {resetOpen && <ResetStaffPasswordDialog staff={member} onClose={() => setResetOpen(false)} />}
      {lockOpen && (
        <LockStaffDialog
          name={name}
          locking={!locked}
          pending={setActive.isPending}
          onOpenChange={setLockOpen}
          onConfirm={() => setActive.mutate({ userId: member.id, isActive: locked })}
        />
      )}
    </>
  );
}
