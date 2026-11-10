"use client";

import { useState } from "react";
import { Copy, MoreHorizontal, Pencil, Power, PowerOff, Ticket, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  ADMIN_ROW_ICON_BUTTON_CLASS,
  AdminDataTable,
  AdminDialog,
  AdminListPanel,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { useVoucherActions } from "../../hooks/useVoucherActions";
import { type AdminVoucher, type AdminVouchersData } from "../../types/vouchers.types";
import { SHOP_TIME_ZONE, VOUCHER_STATES, voucherState, type VoucherState } from "../../utils/voucherRules";
import { UsageMeter, VoucherStateText, useOfferText } from "../shared/VoucherParts";

const DAY = 24 * 60 * 60 * 1000;
/** Còn bấy nhiêu ngày thì nhắc "sắp hết hạn" */
const ENDING_SOON_DAYS = 3;

/**
 * Màn coupon: tab theo vòng đời tự suy (đang chạy · sắp diễn ra · hết hạn / hết lượt · đã tắt), mỗi dòng đọc như một câu
 * ưu đãi, thời gian kèm "còn N ngày", lượt dùng có thanh. Soạn / sửa ở /admin/vouchers/new | [id].
 */
export function VouchersBoard({ data }: { data: AdminVouchersData }) {
  const t = useTranslations("AdminPage.vouchers");
  const tPage = useTranslations("AdminPage.pages.vouchers");
  const format = useFormatter();
  const router = useRouter();
  const offerText = useOfferText();
  const [tab, setTab] = useState<VoucherState>("RUNNING");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<AdminVoucher | null>(null);
  const { toggle, duplicate, remove } = useVoucherActions(() => setDeleting(null));

  const keyword = search.trim().toLowerCase();
  const searched = data.vouchers.filter(
    (voucher) => !keyword || [voucher.code, voucher.description ?? ""].some((value) => value.toLowerCase().includes(keyword))
  );
  const counts = Object.fromEntries(VOUCHER_STATES.map((state) => [state, searched.filter((voucher) => voucherState(voucher, data.now) === state).length])) as Record<
    VoucherState,
    number
  >;
  const rows = searched.filter((voucher) => voucherState(voucher, data.now) === tab);
  const day = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "numeric", timeZone: SHOP_TIME_ZONE });

  const menuItems = (voucher: AdminVoucher): AppMenuEntry[] => [
    { key: "edit", label: t("menu.edit"), icon: Pencil, href: `/admin/vouchers/${voucher.id}` },
    { key: "duplicate", label: t("menu.duplicate"), icon: Copy, disabled: duplicate.isPending, onSelect: () => duplicate.mutate(voucher.id) },
    {
      key: "toggle",
      label: voucher.isActive ? t("menu.disable") : t("menu.enable"),
      icon: voucher.isActive ? PowerOff : Power,
      disabled: toggle.isPending,
      onSelect: () => toggle.mutate({ voucherId: voucher.id, isActive: !voucher.isActive }),
    },
    { type: "separator", key: "sep" },
    {
      key: "delete",
      label: t("menu.delete"),
      description: voucher.ordersCount > 0 ? t("menu.deleteBlocked") : undefined,
      icon: Trash2,
      tone: "danger",
      disabled: voucher.ordersCount > 0,
      onSelect: () => setDeleting(voucher),
    },
  ];

  const codeCell = (voucher: AdminVoucher) => (
    <div className="min-w-0">
      <Link href={`/admin/vouchers/${voucher.id}`} className="font-mono text-sm font-semibold tracking-wide text-[#09090B] hover:underline">
        {voucher.code}
      </Link>
      {voucher.description && <p className="mt-0.5 truncate text-xs text-[#71717A]">{voucher.description}</p>}
    </div>
  );

  const offerCell = (voucher: AdminVoucher) => {
    const offer = offerText(voucher);
    return (
      <div className="min-w-0">
        <p className="text-[#09090B]">
          {offer.headline}
          {offer.cap && <span className="text-[#71717A]"> · {offer.cap}</span>}
        </p>
        <p className="mt-0.5 text-xs text-[#71717A]">{offer.condition}</p>
      </div>
    );
  };

  const periodCell = (voucher: AdminVoucher) => {
    const state = voucherState(voucher, data.now);
    const daysLeft = Math.ceil((Date.parse(voucher.endDate) - Date.parse(data.now)) / DAY);
    const daysToStart = Math.ceil((Date.parse(voucher.startDate) - Date.parse(data.now)) / DAY);
    return (
      <div className="whitespace-nowrap">
        <p className="tabular-nums text-[#09090B]">
          {day(voucher.startDate)} → {day(voucher.endDate)}
        </p>
        <p className={cn("mt-0.5 text-xs", state === "RUNNING" && daysLeft <= ENDING_SOON_DAYS ? "text-amber-700" : "text-[#71717A]")}>
          {state === "RUNNING"
            ? t("period.left", { days: Math.max(daysLeft, 0) })
            : state === "SCHEDULED"
              ? t("period.startsIn", { days: Math.max(daysToStart, 0) })
              : t("period.ordersUsed", { count: voucher.ordersCount })}
        </p>
      </div>
    );
  };

  const columns: AdminTableColumn<AdminVoucher>[] = [
    { key: "code", header: t("column.code"), className: "w-52", cell: codeCell },
    { key: "offer", header: t("column.offer"), cell: offerCell },
    { key: "period", header: t("column.period"), className: "hidden w-44 @3xl:table-cell", cell: periodCell },
    { key: "usage", header: t("column.usage"), className: "hidden w-32 @4xl:table-cell", cell: (voucher) => <UsageMeter used={voucher.usedCount} limit={voucher.usageLimit} /> },
    { key: "state", header: t("column.state"), className: "hidden w-36 whitespace-nowrap @2xl:table-cell", cell: (voucher) => <VoucherStateText voucher={voucher} now={data.now} /> },
  ];

  return (
    <>
      <AdminListPanel
        icon={Ticket}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("create"), onClick: () => router.push("/admin/vouchers/new") }}
      />

      <div role="tablist" aria-label={t("tabsLabel")} className="-mx-1 flex gap-1 overflow-x-auto border-b border-[#E4E4E7] px-1 [scrollbar-width:none]">
        {VOUCHER_STATES.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "-mb-px inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-body transition-colors sm:px-4",
              tab === value ? "border-[#18181B] font-semibold text-[#09090B]" : "border-transparent text-[#71717A] hover:text-[#09090B]"
            )}
          >
            {t(`tab.${value}`)}
            <span className={cn("font-mono text-xs tabular-nums", counts[value] === 0 ? "text-[#D4D4D8]" : "text-[#71717A]")}>{counts[value]}</span>
          </button>
        ))}
      </div>

      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(voucher) => voucher.id}
        rowActions={(voucher) => (
          <AppMenu
            tone="admin"
            width={232}
            align="end"
            sideOffset={4}
            items={menuItems(voucher)}
            trigger={
              <button type="button" aria-label={t("menu.label", { code: voucher.code })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
                <MoreHorizontal size={18} />
              </button>
            }
          />
        )}
        actionsLabel={t("column.actions")}
        minWidth={480}
        empty={data.vouchers.length === 0 ? t("empty") : t(`emptyTab.${tab}`)}
        mobileRow={(voucher) => (
          <div className="space-y-2">
            {codeCell(voucher)}
            {offerCell(voucher)}
            <div className="flex items-start justify-between gap-3 text-xs">
              {periodCell(voucher)}
              <UsageMeter used={voucher.usedCount} limit={voucher.usageLimit} className="text-right" />
            </div>
          </div>
        )}
      />

      {deleting && (
        <AdminDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          icon={Trash2}
          tone="danger"
          title={t("deleteDialog.title", { code: deleting.code })}
          description={t("deleteDialog.description")}
          footer={
            <>
              <button type="button" onClick={() => setDeleting(null)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
                {t("cancel")}
              </button>
              <button type="button" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id)} className={ADMIN_DIALOG_DANGER_BUTTON_CLASS}>
                {t("menu.delete")}
              </button>
            </>
          }
        >
          <p className="text-sm text-[#3F3F46]">{t("deleteDialog.body")}</p>
        </AdminDialog>
      )}
    </>
  );
}
