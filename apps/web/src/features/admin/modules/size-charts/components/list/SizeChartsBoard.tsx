"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Copy, Eye, MoreHorizontal, Pencil, Power, PowerOff, Ruler, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PRODUCT_GROUPS, type ProductGroup } from "@repo/shared/sizing";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { useNotify } from "@/hooks/useNotify";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminFilterSelect, AdminListPanel } from "@/features/admin/core/ui";
import { PRODUCT_GROUP_ICONS, groupUsesSizeChart } from "@/features/admin/modules/categories";
import {
  deleteSizeChartAction,
  duplicateSizeChartAction,
  getSizeChartPreviewAction,
  toggleSizeChartAction,
} from "../../actions/sizeCharts.actions";
import { type AdminSizeChartListItem, type SizeChartPreviewData } from "../../types/sizeCharts.types";

const CreateSizeChartDialog = dynamic(() => import("./CreateSizeChartDialog").then((m) => m.CreateSizeChartDialog));
const SizeChartPreviewDialog = dynamic(() =>
  import("../preview/SizeChartPreviewDialog").then((m) => m.SizeChartPreviewDialog)
);

type GroupFilter = "ALL" | ProductGroup;
// Phụ kiện, vải bán theo mét không có bảng size nên không cần tab
const SIZED_GROUPS = PRODUCT_GROUPS.filter(groupUsesSizeChart);
const MAX_SIZE_CHIPS = 6;

/** Màn danh sách bảng size mẫu: một khối bảng (tab nhóm hàng → tìm kiếm → bảng), thao tác dòng trong menu ⋯ */
export function SizeChartsBoard({ initialCharts }: { initialCharts: AdminSizeChartListItem[] }) {
  const t = useTranslations("AdminPage.sizeCharts");
  const tPage = useTranslations("AdminPage.pages.sizeCharts");
  const tSizing = useTranslations("AdminPage.sizing");
  const notify = useNotify();
  const router = useRouter();
  const [charts, setCharts] = useState(initialCharts);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("ALL");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [preview, setPreview] = useState<SizeChartPreviewData | null>(null);

  const keyword = search.trim().toLowerCase();
  const searched = charts.filter(
    (chart) =>
      !keyword ||
      [chart.name, chart.nameEn ?? "", ...chart.sizeLabels].some((value) => value.toLowerCase().includes(keyword))
  );
  const visible = groupFilter === "ALL" ? searched : searched.filter((chart) => chart.group === groupFilter);

  const handleToggle = async (chart: AdminSizeChartListItem) => {
    const res = await toggleSizeChartAction({ sizeChartId: chart.id, isActive: !chart.isActive });
    if (!res.success) {
      notify.error(res.error, "SIZE_CHART_UPDATE_FAILED");
      return;
    }
    setCharts((prev) => prev.map((c) => (c.id === chart.id ? { ...c, isActive: res.data.isActive } : c)));
    notify.success(res.data.isActive ? t("activated") : t("deactivated"));
  };

  const handleDuplicate = async (chart: AdminSizeChartListItem) => {
    const res = await duplicateSizeChartAction(chart.id);
    if (!res.success) {
      notify.error(res.error, "SIZE_CHART_CREATE_FAILED");
      return;
    }
    setCharts(res.data.charts);
    notify.success(t("duplicated"));
    router.push(`/admin/catalog/size-charts/${res.data.id}`);
  };

  const handlePreview = async (chart: AdminSizeChartListItem) => {
    const res = await getSizeChartPreviewAction(chart.id);
    if (!res.success) {
      notify.error(res.error, "SIZE_CHART_NOT_FOUND");
      return;
    }
    setPreview(res.data);
  };

  const handleDelete = async (chart: AdminSizeChartListItem) => {
    const res = await deleteSizeChartAction(chart.id);
    if (!res.success) {
      notify.error(res.error, "SIZE_CHART_DELETE_FAILED");
      return;
    }
    setCharts((prev) => prev.filter((c) => c.id !== chart.id));
    notify.success(t("deleted"));
  };

  const menuItems = (chart: AdminSizeChartListItem): AppMenuEntry[] => {
    const inUse = chart.productCount > 0 || chart.categoryCount > 0;
    return [
      { key: "edit", label: t("menu.edit"), icon: Pencil, href: `/admin/catalog/size-charts/${chart.id}` },
      { key: "preview", label: t("menu.preview"), icon: Eye, onSelect: () => void handlePreview(chart) },
      { key: "duplicate", label: t("menu.duplicate"), icon: Copy, onSelect: () => void handleDuplicate(chart) },
      {
        key: "toggle",
        label: chart.isActive ? t("menu.deactivate") : t("menu.activate"),
        icon: chart.isActive ? PowerOff : Power,
        disabled: !chart.isActive && chart.sizeLabels.length === 0,
        onSelect: () => void handleToggle(chart),
      },
      { type: "separator", key: "sep" },
      {
        key: "delete",
        label: t("menu.delete"),
        description: inUse ? t("deleteBlocked") : undefined,
        icon: Trash2,
        tone: "danger",
        disabled: inUse,
        onSelect: () => void handleDelete(chart),
      },
    ];
  };

  return (
    <>
      <AdminListPanel
        icon={Ruler}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("create.open"), onClick: () => setIsCreating(true) }}
        filters={
          <AdminFilterSelect
            label={t("groupLabel")}
            value={groupFilter}
            onChange={setGroupFilter}
            options={(["ALL", ...SIZED_GROUPS] as const).map((group) => ({
              value: group,
              label: `${group === "ALL" ? t("filterAll") : tSizing(`group.${group}`)} (${
                group === "ALL" ? searched.length : searched.filter((c) => c.group === group).length
              })`,
            }))}
            className="w-full sm:w-60"
          />
        }
      />

      <section className={ADMIN_CARD_CLASS}>
        {visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#71717A]">
            {charts.length === 0 ? t("empty") : t("noResults")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-body">
              <thead>
                <tr className="whitespace-nowrap border-b border-[#E4E4E7] text-left text-body font-semibold text-[#3F3F46]">
                  <th className="px-4 py-2.5">{t("column.name")}</th>
                  <th className="px-4 py-2.5">{t("column.group")}</th>
                  <th className="px-4 py-2.5">{t("column.sizes")}</th>
                  <th className="px-4 py-2.5 text-right">{t("column.products")}</th>
                  <th className="px-4 py-2.5">{t("column.status")}</th>
                  <th className="w-12 px-2 py-2.5" aria-label={t("column.actions")} />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5]">
                {visible.map((chart) => {
                  const Icon = PRODUCT_GROUP_ICONS[chart.group];
                  const extra = chart.sizeLabels.length - MAX_SIZE_CHIPS;
                  return (
                    <tr key={chart.id} className="transition-colors hover:bg-[#FAFAFA]">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/catalog/size-charts/${chart.id}`}
                          className="font-medium text-[#09090B] hover:underline"
                        >
                          {chart.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-[#71717A]">
                          {t("columnsCount", { count: chart.columnKeys.length })}
                          {chart.hasBigsize && ` · ${t("bigsizeConfigured")}`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[#3F3F46]">
                          <Icon size={14} aria-hidden /> {tSizing(`group.${chart.group}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {chart.sizeLabels.length === 0 ? (
                          <span className="text-xs text-amber-700">{t("noRows")}</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {chart.sizeLabels.slice(0, MAX_SIZE_CHIPS).map((label) => (
                              <span
                                key={label}
                                className="rounded-md border border-[#E4E4E7] px-1.5 py-px font-mono text-xs text-[#3F3F46]"
                              >
                                {label}
                              </span>
                            ))}
                            {extra > 0 && <span className="px-1 text-xs text-[#71717A]">+{extra}</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-semibold tabular-nums text-[#09090B]">
                          {chart.productCount}
                        </span>
                        {chart.categoryCount > 0 && (
                          <p className="text-xs text-[#71717A]">
                            {t("categoriesCount", { count: chart.categoryCount })}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
                            chart.isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#F4F4F5] text-[#71717A]"
                          )}
                        >
                          <span
                            className={cn("size-1.5 rounded-full", chart.isActive ? "bg-emerald-500" : "bg-[#A1A1AA]")}
                          />
                          {chart.isActive ? t("status.active") : t("status.inactive")}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <AppMenu
                          tone="admin"
                          width={232}
                          align="end"
                          sideOffset={4}
                          items={menuItems(chart)}
                          trigger={
                            <button
                              type="button"
                              aria-label={t("menu.label", { name: chart.name })}
                              className="grid size-8 cursor-pointer place-items-center rounded-md text-[#71717A] outline-none transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B] data-popup-open:bg-[#F4F4F5]"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isCreating && <CreateSizeChartDialog onOpenChange={setIsCreating} />}
      <SizeChartPreviewDialog chart={preview} onOpenChange={(open) => !open && setPreview(null)} />
    </>
  );
}
