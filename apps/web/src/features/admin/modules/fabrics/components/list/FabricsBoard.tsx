"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Scissors } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import {
  AdminButton,
  AdminFilterSelect,
  AdminListPanel,
} from "@/features/admin/core/ui";
import {
  type AdminFabricRoll,
  type AdminFabricStockData,
  type FabricMovementInput,
  type FabricMovementType,
  type FabricRollInput,
} from "../../types/fabrics.types";
import { FABRIC_STATUS_ORDER, resolveFabricStatus } from "../../utils/fabricStock";
import { FabricRollsTable } from "./FabricRollsTable";
import {
  recordFabricMovementAction,
  upsertFabricRollAction,
  toggleFabricActiveAction,
  toggleFabricProductVisibilityAction,
} from "../../actions/fabrics.actions";

const FabricMovementDialog = dynamic(() => import("../dialog/FabricMovementDialog").then((m) => m.FabricMovementDialog));
const FabricRollDialog = dynamic(() => import("../dialog/FabricRollDialog").then((m) => m.FabricRollDialog));

type StatusFilter = "AVAILABLE" | "ALL" | "ATTENTION" | "OK" | "LOW" | "OUT" | "INACTIVE";

type DialogState =
  | { kind: "movement"; rollId: string; type: FabricMovementType }
  | { kind: "roll"; rollId: string | null; materialId?: string };

/**
 * Màn "Số lượng vải": theo dõi kho vải theo từng cây, cắt may, nhập thêm, hao hụt, kiểm kê.
 * Mặc định lọc hiển thị các cây vải đang còn số lượng (AVAILABLE), hỗ trợ đầy đủ bộ lọc
 * tình trạng, chất liệu, màu sắc và liên kết mẫu áo.
 */
export function FabricsBoard({ data }: { data: AdminFabricStockData }) {
  const t = useTranslations("AdminPage.fabrics");
  const tPage = useTranslations("AdminPage.pages.fabrics");
  const locale = useLocale();
  const format = useFormatter();
  const notify = useNotify();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [prevData, setPrevData] = useState(data);
  const [rolls, setRolls] = useState(data.rolls);
  const [products, setProducts] = useState(data.products);
  const [search, setSearch] = useState("");
  // Mặc định hiện những vải đang còn số lượng (AVAILABLE)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("AVAILABLE");
  const [materialFilter, setMaterialFilter] = useState("ALL");
  const [colorFilter, _setColorFilter] = useState("ALL");
  const [productFilter, _setProductFilter] = useState("ALL");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  // Mốc "bây giờ" cho thời gian tương đối — lấy từ server để khớp hydrate, đẩy lên khi vừa ghi thao tác
  const [now, setNow] = useState(data.now);

  if (prevData !== data) {
    setPrevData(data);
    setRolls(data.rolls);
    setProducts(data.products);
    setNow(data.now);
  }

  const materialOf = (roll: AdminFabricRoll) => data.materials.find((material) => material.id === roll.materialId);
  const colorOf = (roll: AdminFabricRoll) => data.colors.find((color) => color.id === roll.colorId);
  const productOf = (roll: AdminFabricRoll) => products.find((product) => product.id === roll.productId);
  const localized = (item: { name: string; nameEn: string | null } | undefined) =>
    item ? (locale === "en" && item.nameEn ? item.nameEn : item.name) : "";
  const fmt = (value: number) => format.number(value, { maximumFractionDigits: 2 });

  // ─── Lọc & sắp xếp ─────────────────────────────────────────────────────────
  const keyword = search.trim().toLowerCase();

  const matchesStatus = (roll: AdminFabricRoll) => {
    const status = resolveFabricStatus(roll);
    if (statusFilter === "ALL") return true;
    if (statusFilter === "AVAILABLE") return roll.isActive && roll.remainingMeters > 0;
    if (statusFilter === "ATTENTION") return status === "LOW" || status === "OUT";
    return status === statusFilter;
  };

  const matchesMaterial = (roll: AdminFabricRoll) => {
    if (materialFilter === "ALL") return true;
    return roll.materialId === materialFilter;
  };

  const matchesColor = (roll: AdminFabricRoll) => {
    if (colorFilter === "ALL") return true;
    return roll.colorId === colorFilter;
  };

  const matchesProduct = (roll: AdminFabricRoll) => {
    if (productFilter === "ALL") return true;
    if (productFilter === "ATTACHED") return Boolean(roll.productId);
    if (productFilter === "UNATTACHED") return !roll.productId;
    return roll.productId === productFilter;
  };

  const visible = rolls
    .filter((roll) => {
      const haystack = [
        roll.name,
        roll.nameEn ?? "",
        roll.code,
        localized(colorOf(roll)),
        productOf(roll)?.name ?? "",
        productOf(roll)?.code ?? "",
      ];
      return (
        (!keyword || haystack.some((value) => value.toLowerCase().includes(keyword))) &&
        matchesMaterial(roll) &&
        matchesColor(roll) &&
        matchesProduct(roll) &&
        matchesStatus(roll)
      );
    })
    // Cần xử lý lên đầu; cùng tình trạng thì cây ít mét hơn đứng trước
    .sort(
      (a, b) =>
        FABRIC_STATUS_ORDER[resolveFabricStatus(a)] - FABRIC_STATUS_ORDER[resolveFabricStatus(b)] ||
        a.remainingMeters - b.remainingMeters
    );

  // Cây cần nhập thêm, và trong đó cây đã hết mà mẫu áo gắn kèm vẫn đang bán (khách đặt được nhưng không có vải)
  const _attention = rolls.filter((roll) => ["LOW", "OUT"].includes(resolveFabricStatus(roll)));
  const _sellingWithoutFabric = _attention.filter(
    (roll) => resolveFabricStatus(roll) === "OUT" && productOf(roll)?.isVisible
  );

  // ─── Thao tác (gọi Server Action lưu DB) ──────────────────────────────────
  const updateRoll = (rollId: string, update: (roll: AdminFabricRoll) => AdminFabricRoll) =>
    setRolls((prev) => prev.map((roll) => (roll.id === rollId ? update(roll) : roll)));

  const recordMovement = (roll: AdminFabricRoll, input: FabricMovementInput) => {
    startTransition(async () => {
      const res = await recordFabricMovementAction({
        fabricId: roll.id,
        type: input.type,
        meters: input.meters,
        orderCode: input.orderCode,
        note: input.note,
      });
      if (!res.success) {
        notify.error(res.error);
        return;
      }
      const { fabric, movement } = res.data;
      updateRoll(roll.id, (current) => ({
        ...current,
        remainingMeters: fabric.remainingMeters,
        receivedMeters: fabric.receivedMeters,
        updatedAt: fabric.updatedAt,
        movements: [movement, ...current.movements],
      }));
      setDialog(null);
      notify.success(t(`toast.${input.type}`, { name: roll.name, meters: fmt(fabric.remainingMeters) }));
      router.refresh();
    });
  };

  const saveRoll = (rollId: string | null, input: FabricRollInput) => {
    startTransition(async () => {
      const res = await upsertFabricRollAction({
        id: rollId ?? undefined,
        materialId: input.materialId,
        colorId: input.colorId || null,
        name: input.name,
        nameEn: input.nameEn || null,
        code: input.code,
        receivedMeters: input.receivedMeters,
        lowStockThreshold: input.lowStockThreshold,
        productId: input.productId,
      });
      if (!res.success) {
        notify.error(res.error);
        return;
      }
      setDialog(null);
      notify.success(rollId ? t("toast.updated") : t("toast.created", { name: input.name }));
      router.refresh();
    });
  };

  const toggleActive = (roll: AdminFabricRoll) => {
    startTransition(async () => {
      const res = await toggleFabricActiveAction({ fabricId: roll.id });
      if (!res.success) {
        notify.error(res.error);
        return;
      }
      updateRoll(roll.id, (current) => ({ ...current, isActive: res.data.isActive }));
      notify.success(res.data.isActive ? t("toast.activated") : t("toast.deactivated"));
      router.refresh();
    });
  };

  const toggleProduct = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    startTransition(async () => {
      const res = await toggleFabricProductVisibilityAction({ productId });
      if (!res.success) {
        notify.error(res.error);
        return;
      }
      setProducts((prev) => prev.map((item) => (item.id === productId ? { ...item, isVisible: res.data.isActive } : item)));
      if (product) {
        notify.success(
          res.data.isActive
            ? t("toast.productShown", { name: product.name })
            : t("toast.productHidden", { name: product.name })
        );
      }
      router.refresh();
    });
  };

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
        actions={<AdminButton variant="primary" onClick={() => setDialog({ kind: "roll", rollId: null })}>{t("create")}</AdminButton>}
        filters={
          <>
            <AdminFilterSelect
              label={t("filter.status")}
              value={statusFilter}
              onChange={setStatusFilter}
              options={(["AVAILABLE", "ALL", "ATTENTION", "OK", "LOW", "OUT", "INACTIVE"] as const).map((value) => ({
                value,
                label: t(`filter.statusOption.${value}`),
              }))}
              className="w-full sm:w-48"
            />
            <AdminFilterSelect
              label={t("filter.material")}
              value={materialFilter}
              onChange={setMaterialFilter}
              options={[
                { value: "ALL", label: t("filter.all") },
                ...data.materials.map((material) => ({ value: material.id, label: localized(material) })),
              ]}
              className="w-full sm:w-52"
            />
            {/* <AdminFilterSelect
              label={t("filter.color")}
              value={colorFilter}
              onChange={setColorFilter}
              options={[
                { value: "ALL", label: t("filter.all") },
                ...data.colors.map((color) => ({
                  value: color.id,
                  label: (
                    <span className="flex min-w-0 items-center gap-2">
                      <FabricSwatch hex={color.hex ?? null} size="sm" />
                      <span className="truncate">{localized(color)}</span>
                    </span>
                  ),
                  text: localized(color),
                })),
              ]}
              className="w-full sm:w-44"
            />
            <AdminFilterSelect
              label={t("filter.product")}
              value={productFilter}
              onChange={setProductFilter}
              options={[
                { value: "ALL", label: t("filter.productOption.ALL") },
                { value: "ATTACHED", label: t("filter.productOption.ATTACHED") },
                { value: "UNATTACHED", label: t("filter.productOption.UNATTACHED") },
                ...products.map((product) => ({ value: product.id, label: `${product.code} · ${product.name}` })),
              ]}
              className="w-full sm:w-56"
            /> */}
          </>
        }
      />

      {/* Một dòng nhắc việc — chỉ hiện khi có cây cần nhập, không phải thẻ số liệu trang trí */}
      {/* {attention.length > 0 && statusFilter !== "ATTENTION" && (
        <div className={cn(ADMIN_CARD_CLASS, "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center")}>
          <span aria-hidden className="hidden size-2 shrink-0 rounded-full bg-amber-500 sm:block" />
          <p className="flex-1 text-sm text-[#3F3F46]">
            {t.rich("notice.attention", {
              count: attention.length,
              b: (chunks) => <strong className="font-semibold text-[#09090B]">{chunks}</strong>,
            })}
            {sellingWithoutFabric.length > 0 && (
              <span className="text-rose-600"> {t("notice.selling", { count: sellingWithoutFabric.length })}</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => setStatusFilter("ATTENTION")}
            className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "h-8 self-start text-xs sm:self-auto")}
          >
            {t("notice.show")}
          </button>
        </div>
      )} */}

      {/* <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[#71717A]">
          {t("summary", { count: visible.length })}
          {visible.length !== rolls.length && (
            <span className="ml-1 text-[#A1A1AA]">
              ({t("summaryTotal", { total: rolls.length })})
            </span>
          )}
        </p>
      </div> */}

      <FabricRollsTable
        rolls={visible}
        materials={data.materials}
        colors={data.colors}
        products={products}
        now={now}
        onRecordMovement={(roll, type) => setDialog({ kind: "movement", rollId: roll.id, type })}
        onEditRoll={(roll) => setDialog({ kind: "roll", rollId: roll.id })}
        onToggleProduct={toggleProduct}
        onToggleActive={toggleActive}
        emptyText={rolls.length === 0 ? t("empty") : t("noResults")}
      />

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
