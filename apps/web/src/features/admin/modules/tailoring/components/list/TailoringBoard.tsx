"use client";

import { useState } from "react";
import { Scissors } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminFilterSelect, AdminListPanel } from "@/features/admin/core/ui";
import { useMoveStage } from "../../hooks/useMoveStage";
import { TAILORING_STAGES, type TailoringBoardData, type TailoringItem, type TailoringStage } from "../../types/tailoring.types";
import { applyMove } from "../../utils/applyMove";
import { URGENCY_ORDER, compareByDue, nextStage, readTailoringOrder } from "../../utils/tailoringInsight";
import { TailoringProgressTable } from "./TailoringProgressTable";

type DueFilter = "ALL" | "LATE" | "SOON" | "NO_DUE";

/**
 * Màn xưởng đang may — bảng theo tiến trình (mỗi món một dòng, 6 cột công đoạn).
 * Dòng tự xếp theo mức cần xử lý (trễ / không kịp / bị chặn / đơn hủy → sắp hẹn → đúng tiến độ → xong xưởng), rồi theo ngày hẹn;
 * tín hiệu và hạn hiện ngay trên dòng nên không cần chia nhóm hay thẻ số liệu. Phiếu may đầy đủ ở /admin/tailoring/[orderId].
 */
export function TailoringBoard({ data }: { data: TailoringBoardData }) {
  const t = useTranslations("AdminPage.tailoring");
  const tPage = useTranslations("AdminPage.pages.tailoring");
  const [orders, setOrders] = useState(data.orders);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<TailoringStage | null>(null);
  const [due, setDue] = useState<DueFilter>("ALL");
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const move = useMoveStage((result) => setOrders((prev) => applyMove(prev, result)));

  const advance = (item: TailoringItem) => {
    const next = nextStage(item.status);
    if (!next) return;
    setPendingItemId(item.id);
    move.mutate({ itemId: item.id, stage: next }, { onSettled: () => setPendingItemId(null) });
  };

  const read = orders.map((order) => ({ order, insight: readTailoringOrder(order, data.todayKey) }));

  // Đếm món ở mỗi công đoạn (bỏ đơn đã hủy) — hiện ở tiêu đề cột
  const stageCounts = Object.fromEntries(
    TAILORING_STAGES.map((value) => [
      value,
      read
        .filter(({ order }) => order.orderStatus !== "CANCELLED" && order.orderStatus !== "REFUNDED")
        .reduce((sum, { order }) => sum + order.items.filter((item) => item.status === value).length, 0),
    ])
  ) as Record<TailoringStage, number>;

  const keyword = search.trim().toLowerCase();
  const rows = read
    .filter(
      ({ order }) =>
        !keyword ||
        [order.orderNumber, order.customerName, order.customerPhone, ...order.items.map((item) => item.productName)].some((value) =>
          value.toLowerCase().includes(keyword)
        )
    )
    .filter(({ order }) => !stage || order.items.some((item) => item.status === stage))
    .filter(({ insight }) =>
      due === "ALL"
        ? true
        : due === "LATE"
          ? insight.dueState === "OVERDUE" || insight.dueState === "AT_RISK"
          : due === "SOON"
            ? insight.dueState === "DUE_SOON"
            : insight.dueState === "NO_DUE"
    )
    .sort(
      (a, b) =>
        URGENCY_ORDER.indexOf(a.insight.urgency) - URGENCY_ORDER.indexOf(b.insight.urgency) || compareByDue(a.order, b.order)
    );

  return (
    <>
      <AdminListPanel
        icon={Scissors}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        filters={
          <>
            {/* Công đoạn: màn lớn lọc được bằng tiêu đề cột; bộ lọc này cho màn nhỏ và để thấy đang lọc gì */}
            <AdminFilterSelect
              label={t("filter.stage")}
              value={stage ?? "ALL"}
              onChange={(value) => setStage(value === "ALL" ? null : value)}
              options={[
                { value: "ALL" as const, label: t("filter.all") },
                ...TAILORING_STAGES.map((value) => ({ value, label: `${t(`stage.${value}`)} (${stageCounts[value]})` })),
              ]}
              className="w-full sm:w-60"
            />
            <AdminFilterSelect
              label={t("filter.due")}
              value={due}
              onChange={setDue}
              options={(["ALL", "LATE", "SOON", "NO_DUE"] as const).map((value) => ({ value, label: t(`filter.dueOption.${value}`) }))}
              className="w-full sm:w-60"
            />
          </>
        }
      />

      <TailoringProgressTable
        rows={rows}
        stageCounts={stageCounts}
        activeStage={stage}
        onStageChange={setStage}
        todayKey={data.todayKey}
        pendingItemId={pendingItemId}
        onAdvance={advance}
        empty={orders.length === 0 ? t("empty") : t("noResults")}
      />
    </>
  );
}
