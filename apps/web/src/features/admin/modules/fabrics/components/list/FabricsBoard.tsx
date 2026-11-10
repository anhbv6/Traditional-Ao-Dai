"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Eye, EyeOff, MoreHorizontal, Pencil, Power, PowerOff, Scissors } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_ROW_ICON_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDataTable,
  AdminFilterSelect,
  AdminListPanel,
  AdminSegmentedControl,
  AdminStatusText,
  type AdminStatusTone,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import {
  type AdminFabricRoll,
  type AdminFabricStockData,
  type FabricMovementInput,
  type FabricMovementType,
  type FabricRollInput,
  type FabricStockStatus,
} from "../../types/fabrics.types";
import { FABRIC_STATUS_ORDER, applyMovement, resolveFabricStatus, topsLeft } from "../../utils/fabricStock";
import { MOVEMENT_ICONS } from "../../utils/movementIcons";
import { FabricMeter } from "../shared/FabricMeter";
import { FabricSwatch } from "../shared/FabricSwatch";
import { MaterialStockGrid } from "./MaterialStockGrid";

const FabricMovementDialog = dynamic(() => import("./FabricMovementDialog").then((m) => m.FabricMovementDialog));
const FabricRollDialog = dynamic(() => import("./FabricRollDialog").then((m) => m.FabricRollDialog));

type View = "rolls" | "materials";
type StatusFilter = "ALL" | "ATTENTION" | "OK" | "OUT" | "INACTIVE";

const STATUS_TONE: Record<FabricStockStatus, AdminStatusTone> = {
  OK: "success",
  LOW: "warning",
  OUT: "danger",
  INACTIVE: "neutral",
};

type DialogState =
  | { kind: "movement"; rollId: string; type: FabricMovementType }
  | { kind: "roll"; rollId: string | null; materialId?: string };

/** Tên người thực hiện ở bản mock — khi nối DB lấy từ phiên server */
const MOCK_ACTOR = "Quản trị";

/**
 * Màn "Số lượng vải": cây vải nào sắp hết, còn cắt được bao nhiêu áo, ghi cắt / nhập / hao hụt / kiểm kê.
 * Hai cách xem: theo từng cây vải (bảng) và theo chất liệu (thẻ tổng). Dữ liệu đang là mock, thao tác chỉ đổi state ở client.
 */
export function FabricsBoard({ data }: { data: AdminFabricStockData }) {
  const t = useTranslations("AdminPage.fabrics");
  const tPage = useTranslations("AdminPage.pages.fabrics");
  const locale = useLocale();
  const format = useFormatter();
  const notify = useNotify();
  const [rolls, setRolls] = useState(data.rolls);
  const [products, setProducts] = useState(data.products);
  const [search, setSearch] = useState("");
  const [materialFilter, setMaterialFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [view, setView] = useState<View>("rolls");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  // Mốc "bây giờ" cho thời gian tương đối — lấy từ server để khớp hydrate, đẩy lên khi vừa ghi thao tác
  const [now, setNow] = useState(data.now);

  const materialOf = (roll: AdminFabricRoll) => data.materials.find((material) => material.id === roll.materialId);
  const colorOf = (roll: AdminFabricRoll) => data.colors.find((color) => color.id === roll.colorId);
  const productOf = (roll: AdminFabricRoll) => products.find((product) => product.id === roll.productId);
  const localized = (item: { name: string; nameEn: string | null } | undefined) =>
    item ? (locale === "en" && item.nameEn ? item.nameEn : item.name) : "";
  const fmt = (value: number) => format.number(value, { maximumFractionDigits: 2 });
  const relative = (iso: string) => format.relativeTime(new Date(iso), new Date(now));

  // ─── Lọc & sắp xếp ─────────────────────────────────────────────────────────
  const keyword = search.trim().toLowerCase();
  const matchesStatus = (status: FabricStockStatus) =>
    statusFilter === "ALL" ||
    (statusFilter === "ATTENTION" ? status === "LOW" || status === "OUT" : status === statusFilter);
  const visible = rolls
    .filter((roll) => {
      const haystack = [roll.name, roll.code, localized(colorOf(roll)), productOf(roll)?.name ?? "", productOf(roll)?.code ?? ""];
      return (
        (!keyword || haystack.some((value) => value.toLowerCase().includes(keyword))) &&
        (materialFilter === "ALL" || roll.materialId === materialFilter) &&
        matchesStatus(resolveFabricStatus(roll))
      );
    })
    // Cần xử lý lên đầu; cùng tình trạng thì cây ít mét hơn đứng trước
    .sort(
      (a, b) =>
        FABRIC_STATUS_ORDER[resolveFabricStatus(a)] - FABRIC_STATUS_ORDER[resolveFabricStatus(b)] ||
        a.remainingMeters - b.remainingMeters
    );

  // Cây cần nhập thêm, và trong đó cây đã hết mà mẫu áo gắn kèm vẫn đang bán (khách đặt được nhưng không có vải)
  const attention = rolls.filter((roll) => ["LOW", "OUT"].includes(resolveFabricStatus(roll)));
  const sellingWithoutFabric = attention.filter(
    (roll) => resolveFabricStatus(roll) === "OUT" && productOf(roll)?.isVisible
  );

  // ─── Thao tác (mock: chỉ đổi state) ────────────────────────────────────────
  const updateRoll = (rollId: string, update: (roll: AdminFabricRoll) => AdminFabricRoll) =>
    setRolls((prev) => prev.map((roll) => (roll.id === rollId ? update(roll) : roll)));

  const recordMovement = (roll: AdminFabricRoll, input: FabricMovementInput) => {
    const nowIso = new Date().toISOString();
    setNow(nowIso);
    const after = applyMovement(roll.remainingMeters, input.type, input.meters);
    updateRoll(roll.id, (current) => ({
      ...current,
      remainingMeters: after,
      // Nhập thêm vượt mốc lúc nhập thì nới mốc để thanh không tràn
      receivedMeters: Math.max(current.receivedMeters, after),
      updatedAt: nowIso,
      movements: [
        {
          id: `${current.id}-${Date.now()}`,
          type: input.type,
          delta: after - current.remainingMeters,
          balanceAfter: after,
          orderCode: input.orderCode,
          note: input.note,
          actorName: MOCK_ACTOR,
          createdAt: nowIso,
        },
        ...current.movements,
      ],
    }));
    setDialog(null);
    notify.success(t(`toast.${input.type}`, { name: roll.name, meters: fmt(after) }));
  };

  const saveRoll = (rollId: string | null, input: FabricRollInput) => {
    const nowIso = new Date().toISOString();
    setNow(nowIso);
    if (rollId) {
      updateRoll(rollId, (roll) => ({
        ...roll,
        ...input,
        receivedMeters: roll.receivedMeters,
        updatedAt: nowIso,
      }));
      notify.success(t("toast.updated"));
    } else {
      const id = `f-${Date.now()}`;
      setRolls((prev) => [
        {
          id,
          ...input,
          remainingMeters: input.receivedMeters,
          isActive: true,
          receivedAt: nowIso,
          updatedAt: nowIso,
          movements: [
            {
              id: `${id}-0`,
              type: "RESTOCK",
              delta: input.receivedMeters,
              balanceAfter: input.receivedMeters,
              orderCode: null,
              note: null,
              actorName: MOCK_ACTOR,
              createdAt: nowIso,
            },
          ],
        },
        ...prev,
      ]);
      notify.success(t("toast.created", { name: input.name }));
    }
    setDialog(null);
  };

  const toggleActive = (roll: AdminFabricRoll) => {
    updateRoll(roll.id, (current) => ({ ...current, isActive: !current.isActive }));
    notify.success(roll.isActive ? t("toast.deactivated") : t("toast.activated"));
  };

  const toggleProduct = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    setProducts((prev) => prev.map((item) => (item.id === productId ? { ...item, isVisible: !item.isVisible } : item)));
    if (product) notify.success(product.isVisible ? t("toast.productHidden", { name: product.name }) : t("toast.productShown", { name: product.name }));
  };

  const menuItems = (roll: AdminFabricRoll): AppMenuEntry[] => {
    const product = productOf(roll);
    const movement = (type: FabricMovementType): AppMenuEntry => ({
      key: type,
      label: t(`menu.${type}`),
      icon: MOVEMENT_ICONS[type],
      disabled: !roll.isActive || ((type === "CUT" || type === "WASTE") && roll.remainingMeters <= 0),
      onSelect: () => setDialog({ kind: "movement", rollId: roll.id, type }),
    });
    return [
      movement("CUT"),
      movement("RESTOCK"),
      movement("WASTE"),
      movement("ADJUST"),
      { type: "separator", key: "sep-1" },
      { key: "edit", label: t("menu.edit"), icon: Pencil, onSelect: () => setDialog({ kind: "roll", rollId: roll.id }) },
      ...(product
        ? [
            {
              key: "product",
              label: product.isVisible ? t("menu.hideProduct") : t("menu.showProduct"),
              description: product.code,
              icon: product.isVisible ? EyeOff : Eye,
              onSelect: () => toggleProduct(product.id),
            },
          ]
        : []),
      {
        key: "toggle",
        label: roll.isActive ? t("menu.deactivate") : t("menu.activate"),
        icon: roll.isActive ? PowerOff : Power,
        onSelect: () => toggleActive(roll),
      },
    ];
  };

  // ─── Ô bảng ────────────────────────────────────────────────────────────────
  const nameCell = (roll: AdminFabricRoll) => (
    <div className="flex min-w-0 items-center gap-3">
      <FabricSwatch hex={colorOf(roll)?.hex ?? null} className={cn(!roll.isActive && "opacity-40")} />
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => setDialog({ kind: "movement", rollId: roll.id, type: roll.isActive && roll.remainingMeters > 0 ? "CUT" : "RESTOCK" })}
          className="max-w-full cursor-pointer truncate text-left font-medium text-[#09090B] hover:underline"
        >
          {roll.name}
        </button>
        <p className="mt-0.5 truncate text-xs text-[#71717A]">
          <span className="font-mono text-2xs">{roll.code}</span> · {localized(materialOf(roll))}
        </p>
      </div>
    </div>
  );

  const meterCell = (roll: AdminFabricRoll) => (
    <FabricMeter
      remaining={roll.remainingMeters}
      received={roll.receivedMeters}
      threshold={roll.lowStockThreshold}
      status={resolveFabricStatus(roll)}
      tops={topsLeft(roll.remainingMeters, materialOf(roll)?.metersPerTop ?? null)}
    />
  );

  const productCell = (roll: AdminFabricRoll) => {
    const product = productOf(roll);
    if (!product) return <span className="text-[#A1A1AA]">—</span>;
    return (
      <div className="min-w-0">
        <p className="truncate text-[#3F3F46]">{product.name}</p>
        <p className={cn("mt-0.5 text-xs", product.isVisible ? "text-[#71717A]" : "text-[#A1A1AA]")}>
          <span className="font-mono text-2xs">{product.code}</span> · {product.isVisible ? t("product.visible") : t("product.hidden")}
        </p>
      </div>
    );
  };

  const statusCell = (roll: AdminFabricRoll) => {
    const status = resolveFabricStatus(roll);
    return (
      <div>
        <AdminStatusText tone={STATUS_TONE[status]}>{t(`status.${status}`)}</AdminStatusText>
        <p className="mt-1 pl-4 text-xs text-[#71717A]">{relative(roll.updatedAt)}</p>
      </div>
    );
  };

  const columns: AdminTableColumn<AdminFabricRoll>[] = [
    { key: "name", header: t("column.roll"), cell: nameCell },
    { key: "meters", header: t("column.remaining"), className: "w-[240px] xl:w-[280px]", cell: meterCell },
    { key: "product", header: t("column.product"), className: "hidden w-[220px] lg:table-cell", cell: productCell },
    { key: "status", header: t("column.status"), className: "w-[150px] whitespace-nowrap", cell: statusCell },
  ];

  const dialogRoll = dialog?.kind === "movement" || (dialog?.kind === "roll" && dialog.rollId)
    ? rolls.find((roll) => roll.id === dialog.rollId) ?? null
    : null;

  return (
    <>
      <AdminListPanel
        icon={Scissors}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("create"), onClick: () => setDialog({ kind: "roll", rollId: null }) }}
        filters={
          <>
            <AdminFilterSelect
              label={t("filter.material")}
              value={materialFilter}
              onChange={setMaterialFilter}
              options={[
                { value: "ALL", label: t("filter.all") },
                ...data.materials.map((material) => ({ value: material.id, label: localized(material) })),
              ]}
              className="w-full sm:w-60"
            />
            <AdminFilterSelect
              label={t("filter.status")}
              value={statusFilter}
              onChange={setStatusFilter}
              options={(["ALL", "ATTENTION", "OK", "OUT", "INACTIVE"] as const).map((value) => ({
                value,
                label: value === "ALL" ? t("filter.all") : t(`filter.statusOption.${value}`),
              }))}
              className="w-full sm:w-56"
            />
          </>
        }
      />

      {/* Một dòng nhắc việc — chỉ hiện khi có cây cần nhập, không phải thẻ số liệu trang trí */}
      {attention.length > 0 && statusFilter !== "ATTENTION" && (
        <div className={cn(ADMIN_CARD_CLASS, "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center")}>
          <span aria-hidden className="hidden size-2 shrink-0 rounded-full bg-amber-500 sm:block" />
          <p className="flex-1 text-sm text-[#3F3F46]">
            {t.rich("notice.attention", { count: attention.length, b: (chunks) => <strong className="font-semibold text-[#09090B]">{chunks}</strong> })}
            {sellingWithoutFabric.length > 0 && (
              <span className="text-rose-600"> {t("notice.selling", { count: sellingWithoutFabric.length })}</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ATTENTION");
              setView("rolls");
            }}
            className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "h-8 self-start text-xs sm:self-auto")}
          >
            {t("notice.show")}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[#71717A]">
          {view === "rolls" ? t("summary", { count: visible.length }) : t("summaryMaterials", { count: data.materials.length })}
        </p>
        <AdminSegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: "rolls", label: t("view.rolls") },
            { value: "materials", label: t("view.materials") },
          ]}
        />
      </div>

      {view === "rolls" ? (
        <AdminDataTable
          rows={visible}
          columns={columns}
          getRowId={(roll) => roll.id}
          rowActions={(roll) => (
            <AppMenu
              tone="admin"
              width={240}
              align="end"
              sideOffset={4}
              items={menuItems(roll)}
              trigger={
                <button type="button" aria-label={t("menu.label", { name: roll.name })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
                  <MoreHorizontal size={18} />
                </button>
              }
            />
          )}
          actionsLabel={t("column.actions")}
          minWidth={640}
          empty={rolls.length === 0 ? t("empty") : t("noResults")}
          mobileRow={(roll) => (
            <div className="space-y-3">
              {nameCell(roll)}
              {meterCell(roll)}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                <AdminStatusText tone={STATUS_TONE[resolveFabricStatus(roll)]}>
                  {t(`status.${resolveFabricStatus(roll)}`)}
                </AdminStatusText>
                <span className="text-[#71717A]">{relative(roll.updatedAt)}</span>
              </div>
            </div>
          )}
        />
      ) : (
        <MaterialStockGrid
          materials={materialFilter === "ALL" ? data.materials : data.materials.filter((m) => m.id === materialFilter)}
          rolls={rolls}
          colors={data.colors}
          onOpenRoll={(roll) =>
            setDialog({ kind: "movement", rollId: roll.id, type: roll.isActive && roll.remainingMeters > 0 ? "CUT" : "RESTOCK" })
          }
          onAddRoll={(materialId) => setDialog({ kind: "roll", rollId: null, materialId })}
        />
      )}

      {dialog?.kind === "movement" && dialogRoll && (
        <FabricMovementDialog
          key={`${dialogRoll.id}-${dialog.type}`}
          roll={dialogRoll}
          material={materialOf(dialogRoll)}
          hex={colorOf(dialogRoll)?.hex ?? null}
          initialType={dialog.type}
          now={now}
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={(input) => recordMovement(dialogRoll, input)}
        />
      )}

      {dialog?.kind === "roll" && (
        <FabricRollDialog
          key={dialog.rollId ?? "new"}
          roll={dialogRoll}
          materials={data.materials}
          colors={data.colors}
          products={products}
          existingCodes={rolls.map((roll) => roll.code)}
          defaultMaterialId={dialog.materialId}
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={(input) => saveRoll(dialog.rollId, input)}
        />
      )}
    </>
  );
}
