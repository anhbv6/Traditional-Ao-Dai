"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, AlertTriangle, UserCheck, RefreshCw, FileText } from "lucide-react";
import { showToast } from "@/components/ui/toast";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getApprovalRequestsAction,
  reviewApprovalRequestAction,
} from "../../server";

export function AdminApprovalsList() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    const filter = statusFilter === "ALL" ? undefined : (statusFilter as any);
    const res = await getApprovalRequestsAction(filter);
    if (res.success && res.data) {
      setRequests(res.data);
    } else {
      showToast.error("Không thể tải danh sách phê duyệt.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    if (!user) return;
    setIsProcessing(true);
    const res = await reviewApprovalRequestAction({
      requestId: id,
      status: "APPROVED",
      reviewedById: user.id,
    });

    if (res.success) {
      showToast.success("Đã phê duyệt yêu cầu thành công!");
      fetchRequests();
    } else {
      showToast.error(res.error || "Không thể phê duyệt yêu cầu.");
    }
    setIsProcessing(false);
  };

  const handleReject = async (id: string) => {
    if (!user || !rejectReason.trim()) {
      showToast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    setIsProcessing(true);
    const res = await reviewApprovalRequestAction({
      requestId: id,
      status: "REJECTED",
      reviewedById: user.id,
      rejectReason: rejectReason.trim(),
    });

    if (res.success) {
      showToast.success("Đã từ chối yêu cầu thành công!");
      setRejectingId(null);
      setRejectReason("");
      fetchRequests();
    } else {
      showToast.error(res.error || "Không thể từ chối yêu cầu.");
    }
    setIsProcessing(false);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CANCEL_ORDER":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Hủy đơn hàng</span>;
      case "SPECIAL_DISCOUNT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Giảm giá vượt trần</span>;
      case "PRICE_OVERRIDE":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Chỉnh sửa đơn giá</span>;
      case "REFUND":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Hoàn tiền khách</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700">{action}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            <span>Chờ duyệt</span>
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} />
            <span>Đã duyệt</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} />
            <span>Từ chối</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <UserCheck size={20} className="text-zinc-800" />
            <span>Hàng Đợi Phê Duyệt Của Nhân Viên</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Duyệt các thao tác nhạy cảm do Staff gửi lên (hủy đơn, giảm giá đặc biệt, sửa giá).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex bg-zinc-100 p-1 rounded-xl text-xs font-medium">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {tab === "ALL" && "Tất cả"}
                {tab === "PENDING" && "Chờ duyệt"}
                {tab === "APPROVED" && "Đã duyệt"}
                {tab === "REJECTED" && "Từ chối"}
              </button>
            ))}
          </div>

          <button
            onClick={fetchRequests}
            disabled={isLoading}
            className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center text-sm text-zinc-500">
          <RefreshCw size={24} className="animate-spin mx-auto text-zinc-400 mb-3" />
          <p>Đang tải dữ liệu hàng đợi phê duyệt...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center text-zinc-500">
          <FileText size={32} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-700">Không có yêu cầu phê duyệt nào</p>
          <p className="text-xs text-zinc-400 mt-1">Các thao tác do nhân viên gửi lên sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {getActionBadge(req.actionType)}
                  {getStatusBadge(req.status)}
                  <span className="text-xs text-zinc-400">
                    {new Date(req.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div className="text-xs text-zinc-600">
                  Người yêu cầu: <strong className="text-zinc-900 font-semibold">{req.requestedBy?.name || req.requestedBy?.email}</strong>
                </div>
              </div>

              <div className="py-3 text-sm text-zinc-800">
                <p className="font-medium">{req.description}</p>
                {req.payload && (
                  <div className="mt-2 p-3 bg-zinc-50 rounded-xl text-xs font-mono text-zinc-600 border border-zinc-100 overflow-x-auto">
                    {JSON.stringify(req.payload, null, 2)}
                  </div>
                )}
              </div>

              {req.status === "REJECTED" && req.rejectReason && (
                <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-xs text-rose-700 flex items-start gap-2 mb-3">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span><strong>Lý do từ chối:</strong> {req.rejectReason}</span>
                </div>
              )}

              {/* Action Buttons for PENDING */}
              {req.status === "PENDING" && (
                <div className="pt-2 flex items-center justify-end gap-2">
                  {rejectingId === req.id ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Nhập lý do từ chối..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="text-xs border border-zinc-300 rounded-lg px-3 py-1.5 w-full sm:w-64 focus:border-rose-500 outline-none"
                      />
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Xác nhận
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(""); }}
                        className="px-3 py-1.5 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 rounded-lg text-xs cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setRejectingId(req.id)}
                        disabled={isProcessing}
                        className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                      >
                        Phê duyệt yêu cầu
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
