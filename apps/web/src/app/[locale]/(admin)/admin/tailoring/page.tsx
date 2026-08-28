import React from "react";
import { getTailoringItemsQuery, TailoringBoard } from "@/features/admin/tailoring";
import { Scissors } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTailoringPage() {
  const tailoringItems = await getTailoringItemsQuery();

  return (
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E4E4E7] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700">
            <Scissors size={14} /> Xưởng may đo thủ công
          </div>
          <h2 className="text-2xl font-bold text-[#09090B] tracking-tight mt-1">
            Tiến Độ May Đo Áo Dài
          </h2>
        </div>
        <div className="text-xs text-zinc-500">
          Đang may <span className="font-mono font-bold text-zinc-900">{tailoringItems.length}</span> áo theo số đo riêng
        </div>
      </div>

      <TailoringBoard initialItems={tailoringItems} />
    </div>
  );
}
