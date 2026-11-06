"use client";

import { useState } from "react";
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
  AdminDataTable,
  AdminListPanel,
  AdminStatusText,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { PRODUCT_GROUP_COLORS, PRODUCT_GROUP_ICONS, groupUsesSizeChart } from "@/features/admin/modules/categories";
import {
  deleteSizeChartAction,
  duplicateSizeChartAction,
  getSizeChartDetailAction,
  toggleSizeChartAction,
} from "../../actions/sizeCharts.actions";
import { type AdminSizeChartDetail, type AdminSizeChartListItem } from "../../types/sizeCharts.types";

const SizeChartInfoDialog = dynamic(() => import("../shared/SizeChartInfoDialog").then((m) => m.SizeChartInfoDialog));

type GroupTab = "ALL" | ProductGroup;
// Phụ kiện, vải bán theo mét không có bảng size → 4 tab: Tất cả, Áo dài, Quần, Giày guốc
const GROUP_TABS: GroupTab[] = ["ALL", ...PRODUCT_GROUPS.filter(groupUsesSizeChart)];

/** Đang mở dialog: tạo mới (`chart` null) hoặc sửa thông tin một bảng */
type DialogState = { chart: AdminSizeChartDetail | null };

/**
 * Màn danh sách bảng size mẫu: tìm kiếm + nút tạo ở đầu, tab nhóm hàng (gạch chân) ngay trên bảng dữ liệu gọn (tên + các size, số sản phẩm dùng,
 * trạng thái), mọi thao tác trong menu ⋯. Tạo mới / sửa thông tin mở SizeChartInfoDialog; số đo sửa ở màn chi tiết.
 */
export function SizeChartsBoard({ charts }: { charts: AdminSizeChartListItem[] }) {
  const t = useTranslations("AdminPage.sizeCharts");
  const tPage = useTranslations("AdminPage.pages.sizeCharts");
  const tSizing = useTranslations("AdminPage.sizing");
  const locale = useLocale();
  const notify = useNotify();
  const router = useRouter();
  const [tab, setTab] = useState<GroupTab>("ALL");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const keyword = search.trim().toLowerCase();
  const searched = charts.filter(
    (chart) =>
      !keyword ||
      [chart.name, chart.nameEn ?? "", ...chart.sizeLabels].some((value) => value.toLowerCase().includes(keyword))
  );
  const visible = tab === "ALL" ? searched : searched.filter((chart) => chart.group === tab);
  const nameOf = (chart: AdminSizeChartListItem) => (locale === "en" && chart.nameEn ? chart.nameEn : chart.name);

  /** Thao tác xong thì tải lại dữ liệu server (danh sách đọc thẳng từ props) */
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

  const nameCell = (chart: AdminSizeChartListItem) => {
    const Icon = PRODUCT_GROUP_ICONS[chart.group];
    return (
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className={cn("grid size-9 shrink-0 place-items-center rounded-xl", PRODUCT_GROUP_COLORS[chart.group].tile)}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <Link href={`/admin/catalog/size-charts/${chart.id}`} className="font-medium text-[#09090B] hover:underline">
            {nameOf(chart)}
          </Link>
          {/* Dòng phụ: các size (tab Tất cả thêm nhóm hàng) — chi tiết số đo xem ở màn chi tiết */}
          <p className="mt-0.5 text-xs leading-relaxed text-[#71717A]">
            {tab === "ALL" && `${tSizing(`group.${chart.group}`)} · `}
            {chart.sizeLabels.length > 0 ? (
              <span className="font-mono">{chart.sizeLabels.join(" · ")}</span>
            ) : (
              <span className="text-amber-700">{t("noRows")}</span>
            )}
          </p>
        </div>
      </div>
    );
  };

  const status = (chart: AdminSizeChartListItem) => (
    <AdminStatusText tone={chart.isActive ? "success" : "neutral"}>
      {chart.isActive ? t("status.active") : t("status.inactive")}
    </AdminStatusText>
  );

  const columns: AdminTableColumn<AdminSizeChartListItem>[] = [
    { key: "name", header: t("column.name"), cell: nameCell },
    {
      key: "products",
      header: t("column.products"),
      align: "right",
      className: "w-32 whitespace-nowrap",
      cell: (chart) => (
        <span className={cn("font-mono tabular-nums", chart.productCount > 0 ? "text-[#09090B]" : "text-[#A1A1AA]")}>
          {chart.productCount}
        </span>
      ),
    },
    { key: "status", header: t("column.status"), className: "w-36 whitespace-nowrap", cell: status },
  ];

  return (
    <>
      <AdminListPanel
        icon={Ruler}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("create.open"), onClick: () => setDialog({ chart: null }) }}
      />

      {/* Tab nhóm hàng ngay trên bảng — kiểu gạch chân tối giản (đơn sắc theo quy chuẩn admin) */}
      <div role="tablist" aria-label={t("groupLabel")} className="flex gap-1 border-b border-[#E4E4E7]">
        {GROUP_TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "-mb-px shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-4 py-2.5 text-body transition-colors",
              tab === value
                ? "border-[#18181B] font-semibold text-[#09090B]"
                : "border-transparent text-[#71717A] hover:text-[#09090B]"
            )}
          >
            {value === "ALL" ? t("filterAll") : tSizing(`group.${value}`)}
          </button>
        ))}
      </div>

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
                aria-label={t("menu.label", { name: nameOf(chart) })}
                className={ADMIN_ROW_ICON_BUTTON_CLASS}
              >
                <MoreHorizontal size={18} />
              </button>
            }
          />
        )}
        actionsLabel={t("column.actions")}
        minWidth={560}
        empty={charts.length === 0 ? t("empty") : t("noResults")}
        mobileRow={(chart) => (
          <div className="space-y-1.5">
            {nameCell(chart)}
            <div className="pl-12 text-xs">{status(chart)}</div>
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
