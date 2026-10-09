"use client";

import React, { useState, useTransition } from "react";
import { type TailoringItemData, type TailoringStatus } from "../types/tailoring.types";
import { updateTailoringStatusAction } from "../actions/tailoring.actions";
import { useAdminSession } from "../../session";
import {
  Scissors,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Ruler,
  User,
  Phone,
  
  Printer,
  ChevronRight,
  XCircle,
  type LucideIcon,
} from "lucide-react";

interface TailoringBoardProps {
  initialItems: TailoringItemData[];
}

const tailoringSteps: { status: TailoringStatus; label: string; icon: LucideIcon; color: string }[] = [
  { status: "WAITING_FABRIC", label: "Chờ xuất vải", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { status: "FABRIC_CUTTING", label: "Đang cắt rập", icon: Scissors, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { status: "SEWING", label: "May ráp tà & cổ", icon: Layers, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { status: "EMBROIDERY_BEADING", label: "Thêu & Đính kết", icon: Sparkles, color: "text-pink-600 bg-pink-50 border-pink-200" },
  { status: "FITTING_IRONING", label: "Kiểm form & Ủi", icon: Ruler, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { status: "COMPLETED", label: "Hoàn tất xưởng", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
];

export function TailoringBoard({ initialItems }: TailoringBoardProps) {
  const [items, setItems] = useState<TailoringItemData[]>(initialItems);
  const [selectedItem, setSelectedItem] = useState<TailoringItemData | null>(null);
  const [filterStep, setFilterStep] = useState<string>("ALL");
  const [noteText, setNoteText] = useState("");
  const { user } = useAdminSession({ force: true });
  const [isPending, startTransition] = useTransition();

  const filteredItems = items.filter((item) => {
    if (filterStep === "ALL") return true;
    return item.tailoringStatus === filterStep;
  });

  const handleUpdateStep = (item: TailoringItemData, newStatus: TailoringStatus) => {
    if (!user?.id) return;
    startTransition(async () => {
      const res = await updateTailoringStatusAction({
        orderItemId: item.id,
        orderId: item.orderId,
        status: newStatus,
        staffId: user.id,
        note: noteText || undefined,
      });

      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, tailoringStatus: newStatus } : i))
        );
        if (selectedItem?.id === item.id) {
          setSelectedItem((prev) => (prev ? { ...prev, tailoringStatus: newStatus } : null));
        }
        setNoteText("");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header filter tags */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStep("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            filterStep === "ALL"
              ? "bg-[#18181B] text-white"
              : "bg-white text-zinc-600 border border-[#E4E4E7] hover:bg-zinc-50"
          }`}
        >
          Tất cả công đoạn ({items.length})
        </button>
        {tailoringSteps.map((step) => {
          const count = items.filter((i) => i.tailoringStatus === step.status).length;
          return (
            <button
              key={step.status}
              onClick={() => setFilterStep(step.status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterStep === step.status
                  ? "bg-[#18181B] text-white"
                  : "bg-white text-zinc-600 border border-[#E4E4E7] hover:bg-zinc-50"
              }`}
            >
              {step.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid of Tailoring Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-xl border border-[#E4E4E7] text-[#71717A]">
            <Scissors className="mx-auto size-10 text-zinc-300 mb-2" />
            Không có mẫu áo dài nào trong công đoạn này.
          </div>
        ) : (
          filteredItems.map((item) => {
            const currentStepObj = tailoringSteps.find((s) => s.status === item.tailoringStatus);
            const StepIcon = currentStepObj?.icon || Scissors;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-xl border border-[#E4E4E7] p-5 shadow-2xs hover:border-zinc-400 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#09090B]">
                        {item.orderNumber}
                      </span>
                      <h4 className="font-semibold text-sm text-[#09090B] mt-0.5 line-clamp-1">
                        {item.productName}
                      </h4>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                        currentStepObj?.color || "bg-zinc-50 text-zinc-700 border-[#E4E4E7]"
                      }`}
                    >
                      <StepIcon size={12} />
                      {currentStepObj?.label || item.tailoringStatus}
                    </span>
                  </div>

                  {/* Customer info */}
                  <div className="text-xs text-zinc-600 space-y-1 mb-4">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-zinc-400" />
                      <span className="font-medium">{item.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-zinc-400" />
                      <span className="font-mono">{item.customerPhone}</span>
                    </div>
                  </div>

                  {/* Quick measurements preview */}
                  <div className="grid grid-cols-4 gap-1.5 bg-zinc-50 p-2.5 rounded-lg border border-[#E4E4E7] text-[11px] mb-3">
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Ngực</span>
                      <span className="font-mono font-semibold text-zinc-800">{item.bust || "--"} cm</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Eo</span>
                      <span className="font-mono font-semibold text-zinc-800">{item.waist || "--"} cm</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Mông</span>
                      <span className="font-mono font-semibold text-zinc-800">{item.hips || "--"} cm</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">Dài áo</span>
                      <span className="font-mono font-semibold text-zinc-800">{item.shirtLength || "--"} cm</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E4E4E7] text-xs text-[#71717A]">
                  <span>{item.latestLog?.staffName ? `Thợ: ${item.latestLog.staffName}` : "Chưa phân công"}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#09090B] hover:underline">
                    Xem hồ sơ đo <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal chi tiết số đo và chuyển công đoạn */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-[#E4E4E7] space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
              <div>
                <div className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                  Phiếu cắt may Áo Dài • {selectedItem.orderNumber}
                </div>
                <h3 className="text-lg font-bold text-[#09090B]">{selectedItem.productName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E4E4E7] text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  <Printer size={14} /> In phiếu cắt
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 text-zinc-400 hover:text-[#09090B] rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Bảng chi tiết 12 thông số vàng của Áo Dài */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3 flex items-center gap-1.5">
                <Ruler size={14} /> Thông số may đo chuẩn (cm / kg)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-xl border border-[#E4E4E7]">
                {[
                  { label: "Chiều cao", val: selectedItem.height ? `${selectedItem.height} cm` : "--" },
                  { label: "Cân nặng", val: selectedItem.weight ? `${selectedItem.weight} kg` : "--" },
                  { label: "Vòng ngực", val: selectedItem.bust ? `${selectedItem.bust} cm` : "--" },
                  { label: "Vòng eo", val: selectedItem.waist ? `${selectedItem.waist} cm` : "--" },
                  { label: "Vòng mông", val: selectedItem.hips ? `${selectedItem.hips} cm` : "--" },
                  { label: "Rộng vai", val: selectedItem.shoulder ? `${selectedItem.shoulder} cm` : "--" },
                  { label: "Dài tay", val: selectedItem.armLength ? `${selectedItem.armLength} cm` : "--" },
                  { label: "Vòng nách", val: selectedItem.armpit ? `${selectedItem.armpit} cm` : "--" },
                  { label: "Vòng cổ", val: selectedItem.neck ? `${selectedItem.neck} cm` : "--" },
                  { label: "Dài áo", val: selectedItem.shirtLength ? `${selectedItem.shirtLength} cm` : "--" },
                  { label: "Dài quần", val: selectedItem.pantsLength ? `${selectedItem.pantsLength} cm` : "--" },
                  { label: "Vòng đùi", val: selectedItem.thigh ? `${selectedItem.thigh} cm` : "--" },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-[#E4E4E7]">
                    <span className="text-[10px] text-[#71717A] block uppercase font-medium">{stat.label}</span>
                    <span className="font-mono font-bold text-sm text-[#09090B]">{stat.val}</span>
                  </div>
                ))}
              </div>
              {selectedItem.customNote && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                  <span className="font-semibold">Ghi chú vóc dáng của khách: </span>
                  {selectedItem.customNote}
                </div>
              )}
            </div>

            {/* Chuyển công đoạn xưởng may */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#71717A] flex items-center gap-1.5">
                <Scissors size={14} /> Chuyển công đoạn xưởng
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tailoringSteps.map((step) => {
                  const isCurrent = selectedItem.tailoringStatus === step.status;
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.status}
                      disabled={isPending || isCurrent}
                      onClick={() => handleUpdateStep(selectedItem, step.status)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#18181B] text-white border-zinc-900 shadow-2xs"
                          : "bg-white text-zinc-700 border-[#E4E4E7] hover:bg-zinc-50 hover:border-zinc-300"
                      }`}
                    >
                      <Icon size={16} />
                      <div className="text-xs font-semibold">{step.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
