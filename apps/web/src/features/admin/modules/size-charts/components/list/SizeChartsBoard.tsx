"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Copy, Eye, MoreHorizontal, Pencil, Power, PowerOff, Ruler, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PRODUCT_GROUPS, type ProductGroup } from "@repo/shared/sizing";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { useNotify } from "@/hooks/useNotify";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_ROW_ICON_BUTTON_CLASS,
  AdminButton,
  AdminDataTable,
  AdminFilterSelect,
  AdminListPanel,
  AdminMetaValue,
  AdminStatusText,
  type AdminFilterOption,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { PRODUCT_GROUP_COLORS, groupUsesSizeChart } from "@/features/admin/modules/categories";
import {
  deleteSizeChartAction,
  duplicateSizeChartAction,
  getSizeChartDetailAction,
  toggleSizeChartAction,
} from "../../actions/sizeCharts.actions";
import { type AdminSizeChartDetail, type AdminSizeChartListItem } from "../../types/sizeCharts.types";

const SizeChartInfoDialog = dynamic(() => import("../shared/SizeChartInfoDialog").then((m) => m.SizeChartInfoDialog));

type GroupFilter = "ALL" | ProductGroup;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type UsageFilter = "ALL" | "IN_USE" | "UNUSED" | "BIGSIZE" | "EMPTY";

/** Các nhóm hàng thực tế có dùng bảng size (loại trừ phụ kiện & vải mét) */
const RELEVANT_GROUPS: ProductGroup[] = PRODUCT_GROUPS.filter(groupUsesSizeChart);

/** Đang mở dialog: tạo mới (`chart` null) hoặc sửa thông tin một bảng */
type DialogState = { chart: AdminSizeChartDetail | null };

/**
 * Lấy tên hiển thị theo ngôn ngữ hiện tại của trang web:
 * - Tiếng Việt (`vi`): hiển thị tiếng Việt, thiếu thì rơi về tiếng Anh.
 * - Tiếng Anh (`en`) hoặc bất kỳ ngôn ngữ nào khác: hiển thị tiếng Anh, thiếu thì rơi về tiếng Việt.
 */
function resolveSizeChartName(chart: AdminSizeChartListItem, currentLocale: string): string {
  if (currentLocale === "vi") {
    return chart.name || chart.nameEn || "";
  }
  return chart.nameEn || chart.name || "";
}

/**
 * Màn danh sách bảng size mẫu (Atelier Size Charts):
 * - Hệ thống lọc đa chiều: nhóm hàng (Áo dài, Quần, Giày guốc), trạng thái áp dụng và phạm vi liên kết / cấu hình.
 * - Bảng dữ liệu hiển thị toàn diện theo phong cách tối giản, chuẩn mực typography: tên & nhóm, dải size trực quan,
 *   thông số đo áp dụng, ngưỡng bigsize may đo, độ phủ sản phẩm / loại sản phẩm và trạng thái vận hành.
 * - Thao tác gom gọn trong menu ⋯ theo chuẩn khu quản trị Thiên Canh.
 */
export function SizeChartsBoard({ charts }: { charts: AdminSizeChartListItem[] }) {
  const t = useTranslations("AdminPage.sizeCharts");
  const tPage = useTranslations("AdminPage.pages.sizeCharts");
  const tSizing = useTranslations("AdminPage.sizing");
  const locale = useLocale();
  const notify = useNotify();
  const router = useRouter();

  const [groupFilter, setGroupFilter] = useState<GroupFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("ALL");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const keyword = search.trim().toLowerCase();

  // Tìm kiếm thông minh: tên theo ngôn ngữ hiển thị, ký hiệu size (XS, M, 2XL) hoặc tên thông số đo (ngực, eo, mông, bust...)
  const visible = useMemo(() => {
    return charts.filter((chart) => {
      if (keyword) {
        const displayName = resolveSizeChartName(chart, locale).toLowerCase();
        const matchesName =
          displayName.includes(keyword) ||
          chart.name.toLowerCase().includes(keyword) ||
          (chart.nameEn?.toLowerCase().includes(keyword) ?? false);
        const matchesSize = chart.sizeLabels.some((s) => s.toLowerCase().includes(keyword));
        const matchesMeasurement = chart.columnKeys.some((k) => {
          const localized = tSizing(`measurement.${k}`).toLowerCase();
          return k.toLowerCase().includes(keyword) || localized.includes(keyword);
        });
        if (!matchesName && !matchesSize && !matchesMeasurement) return false;
      }

      if (groupFilter !== "ALL" && chart.group !== groupFilter) {
        return false;
      }

      if (statusFilter !== "ALL") {
        const wantActive = statusFilter === "ACTIVE";
        if (chart.isActive !== wantActive) return false;
      }

      if (usageFilter !== "ALL") {
        if (usageFilter === "IN_USE" && chart.productCount === 0 && chart.categoryCount === 0) return false;
        if (usageFilter === "UNUSED" && (chart.productCount > 0 || chart.categoryCount > 0)) return false;
        if (usageFilter === "BIGSIZE" && !chart.hasBigsize) return false;
        if (usageFilter === "EMPTY" && chart.sizeLabels.length > 0) return false;
      }

      return true;
    });
  }, [charts, keyword, groupFilter, statusFilter, usageFilter, locale, tSizing]);

  const hasActiveFilters = groupFilter !== "ALL" || statusFilter !== "ALL" || usageFilter !== "ALL" || keyword.length > 0;

  const resetFilters = () => {
    setGroupFilter("ALL");
    setStatusFilter("ALL");
    setUsageFilter("ALL");
    setSearch("");
  };

  /** Thao tác xong thì tải lại dữ liệu server */
  const run = async <T,>(
    action: () => Promise<{ success: true; data: T } | { success: false; error: string }>,
    fallback: string,
    successMessage: string
  ) => {
    const res = await action();
    if (!res.success) {
      notify.error(res.error, fallback);
      return null;
    }
    notify.success(successMessage);
    router.refresh();
    return res.data;
  };

  const openEdit = async (chart: AdminSizeChartListItem) => {
    const res = await getSizeChartDetailAction(chart.id);
    if (!res.success) {
      notify.error(res.error, "SIZE_CHART_NOT_FOUND");
      return;
    }
    setDialog({ chart: res.data });
  };

  const menuItems = (chart: AdminSizeChartListItem): AppMenuEntry[] => {
    const inUse = chart.productCount > 0 || chart.categoryCount > 0;
    return [
      { key: "view", label: t("menu.view"), icon: Eye, href: `/admin/catalog/size-charts/${chart.id}` },
      { key: "edit", label: t("menu.edit"), icon: Pencil, onSelect: () => void openEdit(chart) },
      {
        key: "duplicate",
        label: t("menu.duplicate"),
        icon: Copy,
        onSelect: () => void run(() => duplicateSizeChartAction(chart.id), "SIZE_CHART_CREATE_FAILED", t("duplicated")),
      },
      {
        key: "toggle",
        label: chart.isActive ? t("menu.deactivate") : t("menu.activate"),
        icon: chart.isActive ? PowerOff : Power,
        disabled: !chart.isActive && chart.sizeLabels.length === 0,
        onSelect: () =>
          void run(
            () => toggleSizeChartAction({ sizeChartId: chart.id, isActive: !chart.isActive }),
            "SIZE_CHART_UPDATE_FAILED",
            chart.isActive ? t("deactivated") : t("activated")
          ),
      },
      { type: "separator", key: "sep" },
      {
        key: "delete",
        label: t("menu.delete"),
        description: inUse ? t("deleteBlocked") : undefined,
        icon: Trash2,
        tone: "danger",
        disabled: inUse,
        onSelect: () => void run(() => deleteSizeChartAction(chart.id), "SIZE_CHART_DELETE_FAILED", t("deleted")),
      },
    ];
  };

  // Cấu hình danh sách lựa chọn cho bộ lọc
  const groupOptions: AdminFilterOption<GroupFilter>[] = [
    { value: "ALL", label: `${t("filterAll")} (${charts.length})` },
    ...RELEVANT_GROUPS.map((g) => ({
      value: g,
      label: `${tSizing(`group.${g}`)} (${charts.filter((c) => c.group === g).length})`,
    })),
  ];

  const statusOptions: AdminFilterOption<StatusFilter>[] = [
    { value: "ALL", label: t("filterAll") },
    { value: "ACTIVE", label: `${t("status.active")} (${charts.filter((c) => c.isActive).length})` },
    { value: "INACTIVE", label: `${t("status.inactive")} (${charts.filter((c) => !c.isActive).length})` },
  ];

  const usageOptions: AdminFilterOption<UsageFilter>[] = [
    { value: "ALL", label: t("filterAllUsage") },
    {
      value: "IN_USE",
      label: `${t("filterUsageInUse")} (${charts.filter((c) => c.productCount > 0 || c.categoryCount > 0).length})`,
    },
    {
      value: "UNUSED",
      label: `${t("filterUsageUnused")} (${charts.filter((c) => c.productCount === 0 && c.categoryCount === 0).length})`,
    },
    { value: "BIGSIZE", label: `${t("filterUsageBigsize")} (${charts.filter((c) => c.hasBigsize).length})` },
    { value: "EMPTY", label: `${t("filterUsageEmpty")} (${charts.filter((c) => c.sizeLabels.length === 0).length})` },
  ];

  // Header metric tóm tắt
  const activeCount = charts.filter((c) => c.isActive).length;
  const totalProductsCovered = charts.reduce((sum, c) => sum + c.productCount, 0);

  const nameCell = (chart: AdminSizeChartListItem) => {
    const colors = PRODUCT_GROUP_COLORS[chart.group];
    return (
      <div className="min-w-0 space-y-1 py-1">
        <Link
          href={`/admin/catalog/size-charts/${chart.id}`}
          className="block truncate font-medium text-[#09090B] transition-colors hover:underline"
        >
          {resolveSizeChartName(chart, locale)}
        </Link>
        <div className="flex items-center text-xs">
          <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-2xs font-medium", colors.chip)}>
            {tSizing(`group.${chart.group}`)}
          </span>
        </div>
      </div>
    );
  };

  const sizesCell = (chart: AdminSizeChartListItem) => {
    if (chart.sizeLabels.length === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
          <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
          {t("noRows")}
        </span>
      );
    }
    return (
      <div className="space-y-1 py-1">
        <div className="text-2xs font-medium text-[#71717A]">
          {t("sizesCount", { count: chart.sizeLabels.length })}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {chart.sizeLabels.slice(0, 5).map((size) => (
            <span
              key={size}
              className="inline-block rounded border border-[#E4E4E7] bg-[#FAFAFA] px-1.5 py-0.5 font-mono text-2xs font-semibold text-[#18181B]"
            >
              {size}
            </span>
          ))}
          {chart.sizeLabels.length > 5 && (
            <span className="rounded bg-[#F4F4F5] px-1 py-0.5 font-mono text-2xs font-medium text-[#71717A]">
              +{chart.sizeLabels.length - 5}
            </span>
          )}
        </div>
      </div>
    );
  };

  const measurementsCell = (chart: AdminSizeChartListItem) => {
    if (chart.columnKeys.length === 0) {
      return <span className="text-xs text-[#A1A1AA]">—</span>;
    }
    const names = chart.columnKeys.map((k) => tSizing(`measurement.${k}`));
    return (
      <div className="space-y-1 py-1">
        <div className="text-2xs font-medium text-[#71717A]">
          {t("measurementsCount", { count: chart.columnKeys.length })}
        </div>
        <p className="max-w-[200px] truncate text-xs text-[#3F3F46]" title={names.join(", ")}>
          {names.slice(0, 3).join(", ")}
          {names.length > 3 && <span className="text-[#71717A]"> +{names.length - 3}</span>}
        </p>
      </div>
    );
  };

  const bigsizeCell = (chart: AdminSizeChartListItem) => {
    if (chart.hasBigsize) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/70 px-2.5 py-0.5 text-xs font-medium text-violet-700">
          <span className="size-1.5 shrink-0 rounded-full bg-violet-600" />
          {t("bigsize.hasSurcharge")}
        </span>
      );
    }
    return <span className="text-xs text-[#A1A1AA]">{t("bigsize.standard")}</span>;
  };

  const usageCell = (chart: AdminSizeChartListItem) => {
    const hasUsage = chart.productCount > 0 || chart.categoryCount > 0;
    if (!hasUsage) {
      return <span className="text-xs text-[#A1A1AA]">{t("usage.none")}</span>;
    }
    return (
      <div className="space-y-0.5 py-1 text-right">
        <div className="font-mono text-sm font-semibold tabular-nums text-[#09090B]">
          {chart.productCount}{" "}
          <span className="font-sans text-xs font-normal text-[#71717A]">{t("usage.products")}</span>
        </div>
        {chart.categoryCount > 0 && (
          <div className="text-2xs text-[#71717A]">{t("usage.categories", { count: chart.categoryCount })}</div>
        )}
      </div>
    );
  };

  const statusCell = (chart: AdminSizeChartListItem) => (
    <AdminStatusText tone={chart.isActive ? "success" : "neutral"}>
      {chart.isActive ? t("status.active") : t("status.inactive")}
    </AdminStatusText>
  );

  const columns: AdminTableColumn<AdminSizeChartListItem>[] = [
    { key: "name", header: t("column.name"), className: "min-w-[220px]", cell: nameCell },
    { key: "sizes", header: t("column.sizes"), className: "w-44 whitespace-nowrap", cell: sizesCell },
    { key: "measurements", header: t("column.measurements"), className: "w-52", cell: measurementsCell },
    { key: "bigsize", header: t("column.bigsize"), className: "w-36 whitespace-nowrap", cell: bigsizeCell },
    { key: "usage", header: t("column.usage"), align: "right", className: "w-32 whitespace-nowrap", cell: usageCell },
    { key: "status", header: t("column.status"), className: "w-36 whitespace-nowrap", cell: statusCell },
  ];

  return (
    <>
      <AdminListPanel
        icon={Ruler}
        title={tPage("title")}
        description={tPage("description")}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A] sm:gap-3">
            <span>
              {t("meta.total")}: <AdminMetaValue>{charts.length}</AdminMetaValue>
            </span>
            <span className="text-[#D4D4D8]">·</span>
            <span>
              {t("meta.active")}: <AdminMetaValue>{activeCount}</AdminMetaValue>
            </span>
            <span className="text-[#D4D4D8]">·</span>
            <span>
              {t("meta.linkedProducts")}: <AdminMetaValue>{totalProductsCovered}</AdminMetaValue>{" "}
              {t("meta.productsUnit")}
            </span>
          </div>
        }
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        actions={
          <AdminButton variant="primary" onClick={() => setDialog({ chart: null })}>
            {t("create.open")}
          </AdminButton>
        }
        filters={
          <>
            <AdminFilterSelect
              label={t("filterGroup")}
              value={groupFilter}
              onChange={setGroupFilter}
              options={groupOptions}
              className="w-full sm:w-48"
            />
            <AdminFilterSelect
              label={t("filterStatus")}
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              className="w-full sm:w-44"
            />
            <AdminFilterSelect
              label={t("filterUsage")}
              value={usageFilter}
              onChange={setUsageFilter}
              options={usageOptions}
              className="w-full sm:w-56"
            />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-xl border border-[#E4E4E7] bg-white px-3 text-xs font-medium text-[#71717A] shadow-2xs transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B]"
              >
                {t("resetFilters")}
              </button>
            )}
          </>
        }
      />

      <AdminDataTable
        rows={visible}
        columns={columns}
        getRowId={(chart) => chart.id}
        rowActions={(chart) => (
          <AppMenu
            tone="admin"
            width={232}
            align="end"
            sideOffset={4}
            items={menuItems(chart)}
            trigger={
              <button
                type="button"
                aria-label={t("menu.label", { name: resolveSizeChartName(chart, locale) })}
                className={ADMIN_ROW_ICON_BUTTON_CLASS}
              >
                <MoreHorizontal size={18} />
              </button>
            }
          />
        )}
        actionsLabel={t("column.actions")}
        minWidth={840}
        empty={charts.length === 0 ? t("empty") : t("noResults")}
        mobileRow={(chart) => (
          <div className="space-y-2.5 py-2">
            <div className="flex items-start justify-between gap-3">
              {nameCell(chart)}
              <div className="shrink-0">{statusCell(chart)}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {chart.sizeLabels.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1">
                  {chart.sizeLabels.map((s) => (
                    <span
                      key={s}
                      className="rounded border border-[#E4E4E7] bg-[#FAFAFA] px-1.5 py-0.5 font-mono text-2xs font-semibold text-[#18181B]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-2xs text-amber-700">{t("noRows")}</span>
              )}

              {chart.hasBigsize && (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-2xs font-medium text-violet-700">
                  Bigsize
                </span>
              )}

              <span className="ml-auto text-2xs text-[#71717A]">
                {chart.productCount > 0 ? (
                  <>
                    <strong className="font-mono text-[#09090B]">{chart.productCount}</strong> {t("usage.products")}
                  </>
                ) : (
                  t("usage.none")
                )}
              </span>
            </div>
          </div>
        )}
      />

      {dialog && (
        <SizeChartInfoDialog
          key={dialog.chart?.id ?? "new"}
          chart={dialog.chart}
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
    </>
  );
}
