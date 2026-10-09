"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { LayoutDashboard } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { ADMIN_ACTION_ACCESS, canAccess, useAdminSession } from "../../session";
import { ADMIN_CARD_CLASS, AdminPage, AdminPageHeader, AdminSegmentedControl } from "../../ui";
import { type FilterType } from "../types/dashboard.types";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { DashboardStatsGrid } from "./DashboardStatsGrid";
import { DashboardDonutChart } from "./DashboardDonutChart";
import { DashboardAlerts } from "./DashboardAlerts";
import { DashboardTailoringMonitor } from "./DashboardTailoringMonitor";
import { DashboardOrdersTable } from "./DashboardOrdersTable";
import { DashboardOrderDetailDrawer } from "./DashboardOrderDetailDrawer";

export function AdminDashboard() {
  const t = useTranslations("AdminPage");
  // Mỗi khối dashboard chỉ hiển thị khi người dùng có quyền tương ứng (ma trận ADMIN_ACTION_ACCESS)
  const { user } = useAdminSession({ force: true });
  const access = {
    reports: canAccess(user, ADMIN_ACTION_ACCESS.viewReports),
    inventory: canAccess(user, ADMIN_ACTION_ACCESS.manageInventory),
    tailoring: canAccess(user, ADMIN_ACTION_ACCESS.updateTailoring),
    orders: canAccess(user, ADMIN_ACTION_ACCESS.manageOrders),
  };
  const {
    filter,
    setFilter,
    orders,
    selectedOrder,
    setSelectedOrder,
    stats,
    pieData,
    isLoadingStats,
    isLoadingOrders,
    isUpdatingStatus,
    handleUpdateStatus,
    getStatusColor,
    lowStockItems,
    isLoadingLowStock,
  } = useAdminDashboard(access);

  return (
    <AdminPage>
      <AdminPageHeader
        icon={LayoutDashboard}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("subtitle")}
        actions={
          access.reports ? (
            <>
              {isLoadingStats && <Spinner className="size-4 text-[#71717A]" />}
              <AdminSegmentedControl<FilterType>
                value={filter}
                onChange={setFilter}
                disabled={isLoadingStats}
                options={[
                  { value: "today", label: t("filters.today") },
                  { value: "week", label: t("filters.week") },
                  { value: "month", label: t("filters.month") },
                ]}
              />
            </>
          ) : undefined
        }
      />

      {/* Người dùng chưa được cấp quyền nào trên dashboard */}
      {!access.reports && !access.inventory && !access.tailoring && !access.orders && (
        <div className={`${ADMIN_CARD_CLASS} p-10 text-center`}>
          <p className="text-sm font-semibold text-[#09090B]">{t("noAccess.title")}</p>
          <p className="mt-1 text-xs text-[#71717A]">{t("noAccess.description")}</p>
        </div>
      )}

      {/* Số liệu kinh doanh — cần quyền xem báo cáo */}
      {access.reports && (
      <DashboardStatsGrid
        stats={stats}
        isLoading={isLoadingStats}
        tRevenue={t("stats.revenue")}
        tOrders={t("stats.orders")}
        tPending={t("stats.pending")}
        tRatio={t("stats.ratio")}
        tRatioCustom={t("stats.ratioCustom")}
        tRatioReady={t("stats.ratioReady")}
        tComparedToBefore={t("stats.comparedToBefore")}
        tUrgentTailor={t("stats.urgentTailor")}
      />
      )}

      {/* Biểu đồ (báo cáo) + cảnh báo kho (tồn kho) */}
      {(access.reports || access.inventory) && (
      <div className="grid w-full max-w-full gap-6 lg:grid-cols-3">
        {access.reports && (
        <DashboardDonutChart
          pieData={pieData}
          title={t("chart.title")}
          subtitle={t("chart.subtitle")}
          tOverview={t("chart.overview")}
          tEmpty={t("chart.empty")}
        />
        )}
        {access.inventory && (
        <DashboardAlerts
          items={lowStockItems}
          isLoading={isLoadingLowStock}
          title={t("alerts.title")}
          subtitle={t("alerts.subtitle")}
          tLowStock={t("alerts.lowStock")}
          tStockLeft={t("alerts.stockLeft")}
          tEmpty={t("alerts.empty")}
        />
        )}
      </div>
      )}

      {/* Theo dõi may đo — cần quyền cập nhật may đo */}
      {access.tailoring && (
      <DashboardTailoringMonitor
        orders={orders}
        onSelectOrder={setSelectedOrder}
        title={t("tailoring.title")}
        subtitle={t("tailoring.subtitle")}
        tMeasurements={t("tailoring.measurementsText")}
        tBust={t("tailoring.bust")}
        tWaist={t("tailoring.waist")}
        tDetail={t("tailoring.detailAction")}
        stepLabels={{
          measuring: t("alerts.tailorStep.measuring"),
          cutting: t("alerts.tailorStep.cutting"),
          sewing: t("alerts.tailorStep.sewing"),
          embellishing: t("alerts.tailorStep.embellishing"),
          finishing: t("alerts.tailorStep.finishing"),
        }}
      />
      )}

      {/* Đơn hàng mới & xử lý trạng thái — cần quyền quản lý đơn */}
      {access.orders && (
      <>
      <DashboardOrdersTable
        orders={orders}
        isLoading={isLoadingOrders}
        onSelectOrder={setSelectedOrder}
        getStatusColor={getStatusColor}
        labels={{
          title: t("orders.title"),
          liveBadge: t("orders.liveBadge"),
          orderId: t("orders.orderId"),
          customer: t("orders.customer"),
          type: t("orders.type"),
          total: t("orders.total"),
          status: t("orders.status"),
          actionDetail: t("orders.actionDetail"),
          typeCustom: t("orders.typeCustom"),
          typeReady: t("orders.typeReady"),
          noOrders: t("orders.noOrders"),
          statusLabels: {
            pending_approval: t("orders.statusLabels.pending_approval"),
            cutting_fabric: t("orders.statusLabels.cutting_fabric"),
            sewing_job: t("orders.statusLabels.sewing_job"),
            completed: t("orders.statusLabels.completed"),
            shipping: t("orders.statusLabels.shipping"),
          },
        }}
      />

      {/* Detailed Order Handler Drawer Panel */}
      <DashboardOrderDetailDrawer
        selectedOrder={selectedOrder}
        isUpdating={isUpdatingStatus}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        labels={{
          detailTitle: t("orders.detailTitle"),
          updateStatus: t("orders.updateStatus"),
          customerInfo: t("orders.customerInfo"),
          tailorSpecs: t("orders.tailorSpecs"),
          orderedProducts: t("orders.orderedProducts"),
          totalRevenue: t("orders.totalRevenue"),
          fullName: t("orders.fullName"),
          phone: t("orders.phone"),
          address: t("orders.address"),
          height: t("orders.height"),
          weight: t("orders.weight"),
          bust: t("orders.bust"),
          waist: t("orders.waist"),
          hips: t("orders.hips"),
          customMade: t("orders.customMade"),
          statusLabels: {
            pending_approval: t("orders.statusLabels.pending_approval"),
            cutting_fabric: t("orders.statusLabels.cutting_fabric"),
            sewing_job: t("orders.statusLabels.sewing_job"),
            completed: t("orders.statusLabels.completed"),
            shipping: t("orders.statusLabels.shipping"),
          },
        }}
      />
      </>
      )}
    </AdminPage>
  );
}
