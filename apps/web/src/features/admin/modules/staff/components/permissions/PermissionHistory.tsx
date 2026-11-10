"use client";

import { History } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "@/features/admin/core/ui";
import { type PermissionChangeLog } from "../../types/staff.types";

/** Lịch sử cấp / đổi quyền đọc từ AuditLog: ai đổi, cho ai, thêm (+) / bớt (−) quyền gì — để truy lại khi có sự cố */
export function PermissionHistory({ history, className }: { history: PermissionChangeLog[]; className?: string }) {
  const t = useTranslations("AdminPage.rolePermissions");
  const tStaff = useTranslations("AdminPage.staff");
  const format = useFormatter();

  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5", className)}>
      <header className="mb-3 flex items-center gap-2">
        <History size={18} className="text-[#71717A]" aria-hidden />
        <h2 className="text-lg font-semibold text-[#09090B]">{t("history.title")}</h2>
        <span className="text-xs text-[#71717A]">{t("history.subtitle")}</span>
      </header>
      {history.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#71717A]">{t("history.empty")}</p>
      ) : (
        <ol className="divide-y divide-dashed divide-[#E4E4E7]">
          {history.map((log) => (
            <li key={log.id} className="grid gap-1 py-2.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
              <time className="text-xs tabular-nums text-[#A1A1AA]">
                {format.dateTime(new Date(log.createdAt), { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
              </time>
              <div className="min-w-0 text-sm">
                <p className="text-[#3F3F46]">
                  {t.rich(log.kind === "CREATED" ? "history.created" : "history.updated", {
                    actor: log.actorName ?? t("history.unknown"),
                    target: log.targetName ?? t("history.unknown"),
                    who: (chunks) =>
                      log.targetId ? (
                        <Link href={`/admin/staff/${log.targetId}`} className="font-medium text-[#09090B] hover:underline">
                          {chunks}
                        </Link>
                      ) : (
                        <span className="font-medium text-[#09090B]">{chunks}</span>
                      ),
                  })}
                </p>
                {log.added.length + log.removed.length > 0 ? (
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {log.added.map((permission) => (
                      <span key={`+${permission}`} className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-2xs font-medium text-emerald-700">
                        + {tStaff(`permissionShort.${permission}`)}
                      </span>
                    ))}
                    {log.removed.map((permission) => (
                      <span key={`-${permission}`} className="rounded-md bg-rose-50 px-1.5 py-0.5 text-2xs font-medium text-rose-700">
                        − {tStaff(`permissionShort.${permission}`)}
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-[#A1A1AA]">{t("history.noChange")}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
