"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Copy, Pencil, TableProperties, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd } from "@repo/shared";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDetailHeader,
  AdminStatusText,
} from "@/features/admin/core/ui";
import { deleteSizeChartAction, duplicateSizeChartAction } from "../../actions/sizeCharts.actions";
import { type AdminSizeChartDetail } from "../../types/sizeCharts.types";
import { SizeChartTable } from "../shared/SizeChartTable";

// Dialog chỉ cần khi thao tác nên tách khỏi bundle đầu trang
const SizeChartInfoDialog = dynamic(() => import("../shared/SizeChartInfoDialog").then((m) => m.SizeChartInfoDialog));
const SizeChartGridDialog = dynamic(() => import("./SizeChartGridDialog").then((m) => m.SizeChartGridDialog));

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

/** Nhóm con trong thẻ (h3) — ngăn bằng nét đứt */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-dashed border-[#E4E4E7] pt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 text-body font-semibold text-[#09090B]">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[#A1A1AA]">{children}</p>;
}

/** Một dòng nhãn – giá trị (thẻ Tổng quan, phụ phí bigsize) */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-[#71717A]">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium text-[#09090B]">{children}</span>
    </div>
  );
}

type OpenDialog = "info" | "grid" | null;

/**
 * Màn chi tiết bảng size mẫu — CHỈ XEM, nội dung theo ngôn ngữ giao diện (vi / en). Đầu trang: tên, trạng thái
 * (không dòng phụ); thân một cột: Thông tin chung (ghi chú, hướng dẫn đo, bigsize & phụ phí) rồi Bảng size.
 * Mọi thao tác (sửa thông tin → SizeChartInfoDialog, sửa bảng size → SizeChartGridDialog, nhân bản, xóa) ở menu ⋯.
 */
export function SizeChartDetail({ chart }: { chart: AdminSizeChartDetail }) {
  const t = useTranslations("AdminPage.sizeCharts");
  const tSizing = useTranslations("AdminPage.sizing");
  const locale = useLocale();
  const notify = useNotify();
  const router = useRouter();
  const [open, setOpen] = useState<OpenDialog>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Chỉ hiện nội dung của ngôn ngữ đang dùng; tên tiếng Anh chưa nhập thì lùi về tên tiếng Việt
  const isEn = locale === "en";
  const name = isEn && chart.nameEn ? chart.nameEn : chart.name;
  const description = isEn ? chart.descriptionEn : chart.description;
  const guide = isEn ? chart.measurementGuideEn : chart.measurementGuide;
  const missingText = isEn ? t("detail.noEnglish") : undefined;

  const bigsizeColumns = chart.columns.filter((column) => column.bigsizeFrom !== null);

  const surcharge =
    chart.surchargeType === "PERCENTAGE" && chart.surchargeValue
      ? `${chart.surchargeValue}%`
      : chart.surchargeType === "FIXED_AMOUNT" && chart.surchargeValue
        ? formatVnd(chart.surchargeValue, isEn ? "en" : "vi")
        : null;

  const handleDuplicate = async () => {
    setIsBusy(true);
    try {
      const res = await duplicateSizeChartAction(chart.id);
      if (!res.success) {
        notify.error(res.error, "SIZE_CHART_CREATE_FAILED");
        return;
      }
      notify.success(t("duplicated"));
      router.push(`/admin/catalog/size-charts/${res.data.id}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    setIsBusy(true);
    try {
      const res = await deleteSizeChartAction(chart.id);
      if (!res.success) {
        notify.error(res.error, "SIZE_CHART_DELETE_FAILED");
        return;
      }
      notify.success(t("deleted"));
      router.push("/admin/catalog/size-charts");
    } finally {
      setIsBusy(false);
    }
  };

  // Mọi thao tác của màn gom vào một menu ⋯ ở góc trên
  const inUse = chart.productCount > 0 || chart.categoryNames.length > 0;
  const menuItems: AppMenuEntry[] = [
    { key: "edit", label: t("menu.edit"), icon: Pencil, onSelect: () => setOpen("info") },
    {
      key: "grid",
      label: chart.rows.length > 0 ? t("detail.editGrid") : t("detail.enterGrid"),
      icon: TableProperties,
      onSelect: () => setOpen("grid"),
    },
    {
      key: "duplicate",
      label: t("menu.duplicate"),
      icon: Copy,
      disabled: isBusy,
      onSelect: () => void handleDuplicate(),
    },
    { type: "separator", key: "sep" },
    {
      key: "delete",
      label: t("menu.delete"),
      description: inUse ? t("deleteBlocked") : undefined,
      icon: Trash2,
      tone: "danger",
      disabled: inUse || isBusy,
      onSelect: () => void handleDelete(),
    },
  ];

  return (
    <div className="space-y-5">
      <AdminDetailHeader
        backHref="/admin/catalog/size-charts"
        backLabel={t("detail.back")}
        title={name}
        badge={
          <AdminStatusText tone={chart.isActive ? "success" : "neutral"}>
            {chart.isActive ? t("status.active") : t("status.inactive")}
          </AdminStatusText>
        }
        actions={
          <AppMenu
            tone="admin"
            width={232}
            align="end"
            sideOffset={4}
            items={menuItems}
            trigger={
              <button type="button" className={ADMIN_SECONDARY_BUTTON_CLASS}>
                {t("detail.actions")}
              </button>
            }
          />
        }
      />

      <div className="grid items-start gap-5">
        <div className="min-w-0 space-y-5">
          {/* Thông tin chung gộp ghi chú, hướng dẫn đo, bigsize & phụ phí — mỗi phần một nhóm con */}
          <Card title={t("detail.sections.general")}>
            <div className="space-y-4">
              <Block title={t("field.description")}>
                {description ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[#3F3F46]">{description}</p>
                ) : (
                  <Empty>{missingText ?? t("detail.noNote")}</Empty>
                )}
              </Block>

              <Block title={t("detail.sections.guide")}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    {guide ? (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-[#3F3F46]">{guide}</p>
                    ) : (
                      <Empty>{missingText ?? t("detail.noGuide")}</Empty>
                    )}
                  </div>
                  {chart.guideImage && (
                    // eslint-disable-next-line @next/next/no-img-element -- ảnh tải lên Cloudinary, chưa khai báo remotePatterns
                    <img
                      src={chart.guideImage}
                      alt={t("field.guideImage")}
                      className="aspect-[3/4] w-28 shrink-0 rounded-lg border border-[#E4E4E7] object-cover"
                    />
                  )}
                </div>
              </Block>

              <Block title={t("detail.sections.bigsize")}>
                <div className="space-y-2.5">
                  <InfoRow label={t("field.surchargeValue")}>
                    {surcharge ?? <span className="font-normal text-[#A1A1AA]">{t("detail.surchargeNone")}</span>}
                  </InfoRow>
                  <InfoRow label={t("field.extraFabric")}>
                    {chart.extraFabric !== null ? (
                      <span className="font-mono tabular-nums">{chart.extraFabric} m</span>
                    ) : (
                      <span className="font-normal text-[#A1A1AA]">—</span>
                    )}
                  </InfoRow>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs text-[#71717A]">{t("detail.bigsizeColumns")}</span>
                    {bigsizeColumns.length === 0 ? (
                      <span className="text-sm text-[#A1A1AA]">{t("detail.bigsizeNone")}</span>
                    ) : (
                      <span className="flex flex-wrap justify-end gap-1.5">
                        {bigsizeColumns.map((column) => (
                          <span
                            key={column.key}
                            className="rounded-md border border-[#E4E4E7] px-2 py-0.5 text-xs text-[#3F3F46]"
                          >
                            {tSizing(`measurement.${column.key}`)} ≥{" "}
                            <span className="font-mono tabular-nums">{column.bigsizeFrom}</span>
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              </Block>
            </div>
          </Card>

          <Card title={t("detail.sections.grid")}>
            <SizeChartTable chart={chart} />
          </Card>
        </div>
      </div>

      {open === "info" && <SizeChartInfoDialog chart={chart} onOpenChange={(value) => !value && setOpen(null)} />}
      {open === "grid" && (
        <SizeChartGridDialog chart={chart} title={name} onOpenChange={(value) => !value && setOpen(null)} />
      )}
    </div>
  );
}
