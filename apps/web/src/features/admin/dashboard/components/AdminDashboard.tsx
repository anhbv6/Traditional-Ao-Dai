"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardStatsGrid } from "./DashboardStatsGrid";
import { DashboardDonutChart } from "./DashboardDonutChart";
import { DashboardAlerts } from "./DashboardAlerts";
import { DashboardTailoringMonitor } from "./DashboardTailoringMonitor";
import { DashboardOrdersTable } from "./DashboardOrdersTable";
import { DashboardOrderDetailDrawer } from "./DashboardOrderDetailDrawer";

export function AdminDashboard() {
  const t = useTranslations("AdminPage");
  const {
    filter,
    setFilter,
    orders,
    selectedOrder,
    setSelectedOrder,
    toastMsg,
    stats,
    pieData,
    handleUpdateStatus,
    getStatusColor,
  } = useAdminDashboard();

  return (
    <Container as="section" className="py-12 bg-[#FAFAFA] min-h-screen relative overflow-x-hidden text-[#09090B]">
      <Breadcrumbs />

      {/* Header & Filter Toggle */}
      <DashboardHeader
        title={t("title")}
        subtitle={t("subtitle")}
        filter={filter}
        setFilter={setFilter}
        toastMsg={toastMsg}
        filterLabels={{
          today: t("filters.today"),
          week: t("filters.week"),
          month: t("filters.month"),
        }}
      />

      {/* Stats Cards Section */}
      <DashboardStatsGrid
        stats={stats}
        tRevenue={t("stats.revenue")}
        tOrders={t("stats.orders")}
        tPending={t("stats.pending")}
        tRatio={t("stats.ratio")}
        tRatioCustom={t("stats.ratioCustom")}
        tRatioReady={t("stats.ratioReady")}
      />

      {/* Grid: Charts & In-depth Analytics + Warnings */}
      <div className="grid gap-6 lg:grid-cols-3 mb-10 w-full max-w-full">
        <DashboardDonutChart pieData={pieData} />
        <DashboardAlerts
          tLowFabrics={t("alerts.lowFabrics")}
          tLowStock={t("alerts.lowStock")}
        />
      </div>

      {/* Progress & Tailoring Job Monitor */}
      <DashboardTailoringMonitor
        orders={orders}
        onSelectOrder={setSelectedOrder}
        stepLabels={{
          measuring: t("alerts.tailorStep.measuring"),
          cutting: t("alerts.tailorStep.cutting"),
          sewing: t("alerts.tailorStep.sewing"),
          embellishing: t("alerts.tailorStep.embellishing"),
          finishing: t("alerts.tailorStep.finishing"),
        }}
      />

      {/* Latest Orders Area */}
      <DashboardOrdersTable
        orders={orders}
        onSelectOrder={setSelectedOrder}
        getStatusColor={getStatusColor}
        labels={{
          title: t("orders.title"),
          orderId: t("orders.orderId"),
          customer: t("orders.customer"),
          type: t("orders.type"),
          total: t("orders.total"),
          status: t("orders.status"),
          typeCustom: t("orders.typeCustom"),
          typeReady: t("orders.typeReady"),
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
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        labels={{
          detailTitle: t("orders.detailTitle"),
          updateStatus: t("orders.updateStatus"),
          customerInfo: t("orders.customerInfo"),
          tailorSpecs: t("orders.tailorSpecs"),
          statusLabels: {
            pending_approval: t("orders.statusLabels.pending_approval"),
            cutting_fabric: t("orders.statusLabels.cutting_fabric"),
            sewing_job: t("orders.statusLabels.sewing_job"),
            completed: t("orders.statusLabels.completed"),
            shipping: t("orders.statusLabels.shipping"),
          },
        }}
      />
    </Container>
  );
}
