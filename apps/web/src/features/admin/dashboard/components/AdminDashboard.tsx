"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LayoutDashboard } from "lucide-react";
import { ADMIN_ACTION_ACCESS, canAccess } from "../../session/permissions";
import { type AdminSessionUser } from "../../server/adminAuth.server";
import { ADMIN_CARD_CLASS, AdminPage, AdminPageHeader } from "../../ui";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { type PipelineStage, type TodayAppointment } from "../types/dashboard.types";
import { PIPELINE_STAGE_PERMISSION } from "../utils/pipeline";
import { DashboardKpiCards } from "./DashboardKpiCards";
import { DashboardPipelineBoard } from "./DashboardPipelineBoard";
import { DashboardSchedule } from "./DashboardSchedule";
import { DashboardFabricAlerts } from "./DashboardFabricAlerts";
import { DashboardMeasurementDialog } from "./DashboardMeasurementDialog";

interface AdminDashboardProps {
  /** Người dùng đã xác thực ở page (server) — dùng chung cho SSR và client nên không lệch hydrate */
  user: AdminSessionUser;
}

/**
 * Dashboard vận hành tiệm may đo: A. thẻ chỉ số → B. bảng điều phối may → C. lịch hẹn hôm nay + cảnh báo kho vải.
 * Mỗi khối chỉ hiện khi người dùng có quyền tương ứng (ma trận ADMIN_ACTION_ACCESS).
 */
export function AdminDashboard({ user }: AdminDashboardProps) {
  const t = useTranslations("AdminPage.dashboard");
  const tHeader = useTranslations("AdminPage.header");
  const locale = useLocale();
  const access = {
    operations: canAccess(user, ADMIN_ACTION_ACCESS.viewDashboardOrders),
    inventory: canAccess(user, ADMIN_ACTION_ACCESS.manageInventory),
    reports: canAccess(user, ADMIN_ACTION_ACCESS.viewReports),
  };
  const dashboard = useAdminDashboard(access);
  const [measurementFor, setMeasurementFor] = useState<TodayAppointment | null>(null);

  const canMoveTo = (stage: PipelineStage) => canAccess(user, PIPELINE_STAGE_PERMISSION[stage]);
  // Cố định múi giờ VN để server và trình duyệt render cùng một ngày (tránh lệch hydrate)
  const today = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  return (
    <AdminPage>
      <AdminPageHeader
        icon={LayoutDashboard}
        eyebrow={today}
        title={t("greeting", { name: user.name || tHeader("defaultAdminName") })}
        description={t("description")}
      />

      {!access.operations && !access.inventory && !access.reports ? (
        <div className={`${ADMIN_CARD_CLASS} p-10 text-center`}>
          <p className="text-sm font-semibold text-[#09090B]">{t("noAccess.title")}</p>
          <p className="mt-1 text-xs text-[#71717A]">{t("noAccess.description")}</p>
        </div>
      ) : (
        <DashboardKpiCards kpis={dashboard.kpis} isLoading={dashboard.isLoadingKpis} />
      )}

      {access.operations && (
        <DashboardPipelineBoard
          cards={dashboard.pipeline}
          isLoading={dashboard.isLoadingPipeline}
          canMoveTo={canMoveTo}
          onMove={dashboard.moveStage}
        />
      )}

      {(access.operations || access.inventory) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {access.operations && (
            <DashboardSchedule
              appointments={dashboard.appointments}
              isLoading={dashboard.isLoadingAppointments}
              onOpenMeasurement={setMeasurementFor}
            />
          )}
          {access.inventory && (
            <DashboardFabricAlerts
              fabrics={dashboard.fabrics}
              isLoading={dashboard.isLoadingFabrics}
              hidingProductId={dashboard.hidingProductId}
              onHideProduct={dashboard.hideProduct}
            />
          )}
        </div>
      )}

      <DashboardMeasurementDialog appointment={measurementFor} onClose={() => setMeasurementFor(null)} />
    </AdminPage>
  );
}
