"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarRange,
  CircleCheck,
  Copy,
  Flag,
  Languages,
  MoreHorizontal,
  Package,
  Pause,
  Pencil,
  Play,
  Send,
  Tags,
  Timer,
  Trash2,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { useNotify } from "@/hooks/useNotify";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  ADMIN_ROW_ICON_BUTTON_CLASS,
  AdminDataTable,
  AdminDialog,
  AdminFilterSelect,
  AdminListPanel,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { type AdminSaleEvent, type SaleEventsBoardData, type SaleScope } from "../../types/saleEvents.types";
import { collectSaleInsights, type SaleInsight } from "../../utils/saleInsights";
import { DAY_MS, ENDING_SOON_DAYS, SALE_STATES, appliedProducts, effectiveEnd, mockId, saleState, type SaleState } from "../../utils/saleRules";
import { RevenueBars, SaleBadge, useSaleDateText, useSaleOfferText } from "../shared/SaleParts";
import { SaleTimeline } from "./SaleTimeline";

type ScopeFilter = "ALL_SCOPES" | SaleScope;
type Confirming = { kind: "end" | "delete"; event: AdminSaleEvent } | null;

/** Tên người thực hiện ở bản mock — khi nối DB lấy từ phiên server */
const MOCK_ACTOR = "Bạn";

/**
 * Màn chương trình sale. Bố cục theo việc chứ không chia đều:
 * - Trên: lịch sale (rộng, thấy khoảng trống / chồng lấn giữa các đợt) cạnh cột "Cần để ý" hẹp — ở màn nhỏ "Cần để ý" lên trước.
 * - Dưới: tab vòng đời + bảng; mỗi dòng đọc như một câu ưu đãi, đang chạy thì kèm kết quả bán.
 * Dữ liệu mock — thao tác chỉ đổi state ở client.
 */
export function SaleEventsBoard({ data }: { data: SaleEventsBoardData }) {
  const t = useTranslations("AdminPage.saleEvents");
  const tPage = useTranslations("AdminPage.pages.saleEvents");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const notify = useNotify();
  const offerText = useSaleOfferText();
  const dateText = useSaleDateText();

  const [events, setEvents] = useState(data.events);
  const [tab, setTab] = useState<SaleState>("RUNNING");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("ALL_SCOPES");
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState<Confirming>(null);

  const keyword = search.trim().toLowerCase();
  const filtered = events.filter(
    (event) =>
      (scopeFilter === "ALL_SCOPES" || event.scope === scopeFilter) &&
      (!keyword || [event.name, event.nameEn ?? "", event.badge].some((value) => value.toLowerCase().includes(keyword)))
  );
  const counts = Object.fromEntries(SALE_STATES.map((state) => [state, filtered.filter((event) => saleState(event, data.now) === state).length])) as Record<SaleState, number>;
  const rows = filtered
    .filter((event) => saleState(event, data.now) === tab)
    // Đang chạy: sắp hết lên đầu · sắp chạy: gần nhất lên đầu · đã xong: mới nhất lên đầu
    .sort((a, b) => (tab === "ENDED" ? effectiveEnd(b).localeCompare(effectiveEnd(a)) : tab === "RUNNING" ? a.endAt.localeCompare(b.endAt) : a.startAt.localeCompare(b.startAt)));
  const insights = collectSaleInsights(events, data.products, data.now);

  // ─── Thao tác (mock: chỉ đổi state) ────────────────────────────────────────
  const patch = (id: string, change: Partial<AdminSaleEvent>, kind: AdminSaleEvent["activity"][number]["kind"]) =>
    setEvents((list) =>
      list.map((event) =>
        event.id === id
          ? {
              ...event,
              ...change,
              updatedAt: data.now,
              activity: [{ id: mockId("a"), kind, at: new Date().toISOString(), actor: MOCK_ACTOR, note: null }, ...event.activity],
            }
          : event
      )
    );

  // Nhân bản mở màn tạo mới với giá trị chép sẵn — người soạn chọn lại thời gian rồi mới lưu
  const duplicate = (event: AdminSaleEvent) => router.push(`/admin/sale-events/new?from=${event.id}`);

  const confirmAction = () => {
    if (!confirming) return;
    const { kind, event } = confirming;
    if (kind === "delete") {
      setEvents((list) => list.filter((item) => item.id !== event.id));
      notify.success(t("toast.deleted", { name: event.name }));
    } else {
      patch(event.id, { endedEarlyAt: new Date().toISOString(), featuredOnHome: false }, "ENDED_EARLY");
      notify.success(t("toast.ended", { name: event.name }));
    }
    setConfirming(null);
  };

  const menuItems = (event: AdminSaleEvent): AppMenuEntry[] => {
    const state = saleState(event, data.now);
    const canDelete = state === "DRAFT" || (state === "SCHEDULED" && !event.stats);
    const items: AppMenuEntry[] = [{ key: "edit", label: state === "ENDED" ? t("menu.view") : t("menu.edit"), icon: Pencil, href: `/admin/sale-events/${event.id}` }];
    if (state === "DRAFT")
      items.push({
        key: "publish",
        label: t("menu.publish"),
        icon: Send,
        onSelect: () => {
          patch(event.id, { status: "PUBLISHED" }, "PUBLISHED");
          notify.success(t("toast.published", { name: event.name }));
        },
      });
    if (state === "RUNNING" || state === "SCHEDULED")
      items.push({
        key: "pause",
        label: t("menu.pause"),
        description: t("menu.pauseHint"),
        icon: Pause,
        onSelect: () => {
          patch(event.id, { status: "PAUSED" }, "PAUSED");
          notify.success(t("toast.paused", { name: event.name }));
        },
      });
    if (state === "PAUSED")
      items.push({
        key: "resume",
        label: t("menu.resume"),
        icon: Play,
        onSelect: () => {
          patch(event.id, { status: "PUBLISHED" }, "RESUMED");
          notify.success(t("toast.resumed", { name: event.name }));
        },
      });
    items.push({ key: "duplicate", label: t("menu.duplicate"), icon: Copy, onSelect: () => duplicate(event) });
    if (state === "RUNNING" || state === "PAUSED" || state === "SCHEDULED")
      items.push({ type: "separator", key: "sep-end" }, { key: "end", label: t("menu.endNow"), icon: Flag, tone: "danger", onSelect: () => setConfirming({ kind: "end", event }) });
    if (state !== "ENDED")
      items.push(
        { type: "separator", key: "sep-del" },
        {
          key: "delete",
          label: t("menu.delete"),
          description: canDelete ? undefined : t("menu.deleteBlocked"),
          icon: Trash2,
          tone: "danger",
          disabled: !canDelete,
          onSelect: () => setConfirming({ kind: "delete", event }),
        }
      );
    return items;
  };

  // ─── Ô bảng ────────────────────────────────────────────────────────────────
  const scopeText = (event: AdminSaleEvent) => {
    if (event.scope === "ALL") return t("scopeSummary.ALL");
    const names = event.scopeIds
      .map((id) => (event.scope === "COLLECTIONS" ? data.collections : event.scope === "CATEGORIES" ? data.categories : data.products).find((item) => item.id === id)?.name)
      .filter(Boolean);
    if (event.scope === "PRODUCTS") return t("scopeSummary.PRODUCTS", { count: names.length });
    return t(`scopeSummary.${event.scope}`, { names: names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", ") });
  };

  const nameCell = (event: AdminSaleEvent) => (
    <div className="min-w-0">
      <Link href={`/admin/sale-events/${event.id}`} className="font-medium text-[#09090B] hover:underline">
        {event.name}
      </Link>
      <div className="mt-1 flex min-w-0 items-center gap-2">
        <SaleBadge muted={saleState(event, data.now) === "ENDED"}>{event.badge}</SaleBadge>
        <span className="truncate text-xs text-[#71717A]">{scopeText(event)}</span>
      </div>
    </div>
  );

  const offerCell = (event: AdminSaleEvent) => {
    const count = appliedProducts(event, data.products).length;
    return (
      <div className="min-w-0">
        <p className="text-[#09090B]">{offerText(event)}</p>
        <p className={cn("mt-0.5 text-xs", count === 0 ? "text-rose-600" : "text-[#71717A]")}>{t("productCount", { count })}</p>
      </div>
    );
  };

  const periodCell = (event: AdminSaleEvent) => {
    const state = saleState(event, data.now);
    const nowMs = Date.parse(data.now);
    const daysLeft = Math.ceil((Date.parse(event.endAt) - nowMs) / DAY_MS);
    const daysToStart = Math.ceil((Date.parse(event.startAt) - nowMs) / DAY_MS);
    const note =
      state === "RUNNING" || state === "PAUSED"
        ? t("period.left", { days: Math.max(daysLeft, 0) })
        : state === "SCHEDULED" || state === "DRAFT"
          ? daysToStart > 0
            ? t("period.startsIn", { days: daysToStart })
            : t("period.pastStart")
          : event.endedEarlyAt
            ? t("period.endedEarly", { date: dateText(event.endedEarlyAt) })
            : t("period.lasted", { days: Math.max(1, Math.round((Date.parse(event.endAt) - Date.parse(event.startAt)) / DAY_MS)) });
    return (
      <div className="whitespace-nowrap">
        <p className="tabular-nums text-[#09090B]">
          {dateText(event.startAt)} → {dateText(event.endAt)}
        </p>
        <p className={cn("mt-0.5 text-xs", state === "RUNNING" && daysLeft <= ENDING_SOON_DAYS ? "text-amber-700" : "text-[#71717A]")}>{note}</p>
      </div>
    );
  };

  const resultCell = (event: AdminSaleEvent) =>
    event.stats ? (
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="font-mono tabular-nums text-[#09090B]">{formatVnd(event.stats.revenue, locale)}</p>
          <p className="mt-0.5 text-xs text-[#71717A]">{t("result.line", { orders: event.stats.orders, units: event.stats.units })}</p>
        </div>
        <RevenueBars values={event.stats.dailyRevenue.slice(-14)} className="hidden h-8 w-16 @5xl:flex" label={t("result.barsLabel")} />
      </div>
    ) : (
      <span className="text-xs text-[#A1A1AA]">{t("result.none")}</span>
    );

  const columns: AdminTableColumn<AdminSaleEvent>[] = [
    { key: "name", header: t("column.name"), cell: nameCell },
    { key: "offer", header: t("column.offer"), className: "w-40 whitespace-nowrap", cell: offerCell },
    { key: "period", header: t("column.period"), className: "hidden w-48 @2xl:table-cell", cell: periodCell },
    // Không có cột trạng thái: tab đã lọc theo trạng thái; khác biệt còn lại (kết thúc sớm) nằm ở dòng phụ của cột thời gian
    { key: "result", header: t("column.result"), className: "hidden w-52 @3xl:table-cell", cell: resultCell },
  ];

  return (
    <>
      <AdminListPanel
        icon={Tags}
        title={tPage("title")}
        description={tPage("description")}
        filters={
          <AdminFilterSelect<ScopeFilter>
            label={t("filter.scope")}
            value={scopeFilter}
            onChange={setScopeFilter}
            options={(["ALL_SCOPES", "ALL", "COLLECTIONS", "CATEGORIES", "PRODUCTS"] as const).map((value) => ({ value, label: t(`filter.${value}`) }))}
          />
        }
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("create"), onClick: () => router.push("/admin/sale-events/new") }}
      />

      {/* Điểm ngắt theo bề rộng vùng nội dung (khung admin có thêm cột phải) chứ không theo màn hình */}
      <div className="@container">
      <div className="grid items-start gap-5 @5xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className={cn(ADMIN_CARD_CLASS, "order-2 min-w-0 p-4 sm:p-5 @5xl:order-1")}>
          <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#09090B]">
              <CalendarRange size={18} className="text-[#71717A]" aria-hidden />
              {t("timeline.title")}
            </h2>
            <p className="text-xs text-[#71717A]">{t("timeline.subtitle")}</p>
          </header>
          <SaleTimeline events={filtered} now={data.now} />
        </section>

        <InsightsPanel insights={insights} className="order-1 @5xl:order-2" />
      </div>
      </div>

      <div role="tablist" aria-label={t("tabsLabel")} className="-mx-1 flex gap-1 overflow-x-auto border-b border-[#E4E4E7] px-1 [scrollbar-width:none]">
        {SALE_STATES.map((value) => (
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
            <span className={cn("font-mono text-xs tabular-nums", counts[value] === 0 ? "text-[#D4D4D8]" : value === "PAUSED" ? "text-rose-600" : "text-[#71717A]")}>
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(event) => event.id}
        rowActions={(event) => (
          <AppMenu
            tone="admin"
            width={248}
            align="end"
            sideOffset={4}
            items={menuItems(event)}
            trigger={
              <button type="button" aria-label={t("menu.label", { name: event.name })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
                <MoreHorizontal size={18} />
              </button>
            }
          />
        )}
        actionsLabel={t("column.actions")}
        minWidth={520}
        empty={events.length === 0 ? t("empty") : t(`emptyTab.${tab}`)}
        mobileRow={(event) => (
          <div className="space-y-2.5">
            {nameCell(event)}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {offerCell(event)}
              <div className="text-right">{periodCell(event)}</div>
            </div>
            {event.stats && <div className="border-t border-dashed border-[#E4E4E7] pt-2.5">{resultCell(event)}</div>}
          </div>
        )}
      />

      {confirming && (
        <AdminDialog
          open
          onOpenChange={(open) => !open && setConfirming(null)}
          icon={confirming.kind === "delete" ? Trash2 : Flag}
          tone="danger"
          title={t(`confirm.${confirming.kind}.title`, { name: confirming.event.name })}
          description={t(`confirm.${confirming.kind}.description`)}
          footer={
            <>
              <button type="button" onClick={() => setConfirming(null)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
                {t("cancel")}
              </button>
              <button type="button" onClick={confirmAction} className={confirming.kind === "delete" ? ADMIN_DIALOG_DANGER_BUTTON_CLASS : ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
                {t(`confirm.${confirming.kind}.action`)}
              </button>
            </>
          }
        >
          <p className="text-sm text-[#3F3F46]">{t(`confirm.${confirming.kind}.body`)}</p>
        </AdminDialog>
      )}
    </>
  );
}

const INSIGHT_ICONS: Record<SaleInsight["kind"], typeof Pause> = {
  PAUSED: Pause,
  NO_PRODUCTS: Package,
  OUT_OF_STOCK: Package,
  ENDING_SOON: Timer,
  QUOTA_LOW: Users,
  CONFLICT: AlertTriangle,
  MISSING_EN: Languages,
};

/** Cột "Cần để ý": mỗi dòng một câu nói rõ chuyện gì + bấm thẳng vào chương trình đó */
function InsightsPanel({ insights, className }: { insights: SaleInsight[]; className?: string }) {
  const t = useTranslations("AdminPage.saleEvents");
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 5;
  const shown = expanded ? insights : insights.slice(0, LIMIT);

  const sentence = (item: SaleInsight): ReactNode => {
    switch (item.kind) {
      case "PAUSED":
        return t("insight.PAUSED");
      case "NO_PRODUCTS":
        return t("insight.NO_PRODUCTS");
      case "OUT_OF_STOCK":
        return t("insight.OUT_OF_STOCK", { count: item.products.length, names: item.products.map((product) => product.name).join(", ") });
      case "ENDING_SOON":
        return item.days === 0 ? t("insight.ENDING_TODAY") : t("insight.ENDING_SOON", { days: item.days });
      case "QUOTA_LOW":
        return t("insight.QUOTA_LOW", { product: item.product.name, left: item.left });
      case "CONFLICT":
        return t("insight.CONFLICT", { count: item.count, other: item.other.name });
      case "MISSING_EN":
        return t("insight.MISSING_EN");
    }
  };

  return (
    <section className={cn(ADMIN_CARD_CLASS, "min-w-0 p-4 sm:p-5", className)}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#09090B]">{t("insight.title")}</h2>
        {insights.length > 0 && <span className="font-mono text-xs tabular-nums text-[#71717A]">{insights.length}</span>}
      </header>

      {insights.length === 0 ? (
        <p className="flex items-center gap-2 py-4 text-sm text-[#71717A]">
          <CircleCheck size={16} className="text-emerald-600" aria-hidden />
          {t("insight.none")}
        </p>
      ) : (
        // Xếp chồng (vùng hẹp hơn @5xl) thì panel trải ngang → chia 2 cột cho đỡ dài; đặt cạnh lịch thì 1 cột
        <ul className="-mx-2 grid gap-x-4 @2xl:grid-cols-2 @5xl:grid-cols-1">
          {shown.map((item, index) => {
            const Icon = INSIGHT_ICONS[item.kind];
            return (
              <li
                key={`${item.kind}-${item.event.id}-${index}`}
                className={cn(index > 0 && "border-t border-dashed border-[#E4E4E7]", index === 1 && "@2xl:border-t-0 @5xl:border-t")}
              >
                <Link href={`/admin/sale-events/${item.event.id}`} className="flex gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#FAFAFA]">
                  <span
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                      item.level === "act" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-700"
                    )}
                  >
                    <Icon size={14} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[#09090B]">{item.event.name}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-[#52525B]">{sentence(item)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {insights.length > LIMIT && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-2 cursor-pointer text-xs font-medium text-[#3F3F46] hover:text-[#09090B] hover:underline">
          {expanded ? t("insight.less") : t("insight.more", { count: insights.length - LIMIT })}
        </button>
      )}
    </section>
  );
}
