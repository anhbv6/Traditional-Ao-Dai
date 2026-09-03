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
    stats,
    pieData,
    isLoadingStats,
    isLoadingOrders,
    isUpdatingStatus,
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
        isLoading={isLoadingStats}
        filterLabels={{
          today: t("filters.today"),
          week: t("filters.week"),
          month: t("filters.month"),
        }}
      />

      {/* Stats Cards Section */}
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

      {/* Grid: Charts & In-depth Analytics + Warnings */}
      <div className="grid gap-6 lg:grid-cols-3 mb-10 w-full max-w-full">
        <DashboardDonutChart
          pieData={pieData}
          title={t("chart.title")}
          subtitle={t("chart.subtitle")}
          tOverview={t("chart.overview")}
        />
        <DashboardAlerts
          title={t("alerts.title")}
          subtitle={t("alerts.subtitle")}
          tLowFabrics={t("alerts.lowFabrics")}
          tLowStock={t("alerts.lowStock")}
        />
      </div>

      {/* Progress & Tailoring Job Monitor */}
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

      {/* Latest Orders Area */}
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
    </Container>
  );
}
